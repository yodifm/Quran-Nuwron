import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import {
    BackHandler,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY_COLOR = "#0000FF";
const QIBLA_BASE_URL = "https://time.siswadi.com/qibla";

const Qiblat = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [direction, setDirection] = useState(null);
  const [coords, setCoords] = useState(null);
  const [heading, setHeading] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => {
        subscription.remove();
      };
    }, []),
  );

  useEffect(() => {
    const loadQibla = async () => {
      setLoading(true);
      setError("");
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Izin lokasi ditolak");
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        const places = await Location.reverseGeocodeAsync(position.coords);
        const place = places[0];
        let addressCandidate = "";
        if (place) {
          const rawCity = place.city || "";
          const rawSubregion = place.subregion || "";
          const regionName = place.region || rawSubregion || "";
          const labelCityPart = rawCity || rawSubregion;
          const label =
            labelCityPart && regionName
              ? `${labelCityPart}, ${regionName}`
              : labelCityPart || regionName;
          setLocationLabel(label || "Lokasi tidak diketahui");
          addressCandidate = labelCityPart || regionName || "";
        }

        const extractDeg = (data) => {
          if (!data || typeof data !== "object") return null;
          const d =
            (data.data && (data.data.direction ?? data.data.deg ?? data.data.bearing)) ??
            data.direction ??
            data.deg ??
            data.bearing ??
            (data.qibla && (data.qibla.direction ?? data.qibla.deg ?? data.qibla.bearing));
          return typeof d === "number" && !Number.isNaN(d) ? d : null;
        };

        const tryFetch = async (url) => {
          try {
            const res = await axios.get(url, { timeout: 7000 });
            return extractDeg(res.data);
          } catch {
            return null;
          }
        };

        let deg = null;
        // 1) /lat/lng
        deg = await tryFetch(`${QIBLA_BASE_URL}/${latitude}/${longitude}`);
        // 2) ?lat=&lng=
        if (deg == null) {
          deg = await tryFetch(
            `${QIBLA_BASE_URL}/?lat=${latitude}&lng=${longitude}`,
          );
        }
        // 3) ?address=City
        if (deg == null && addressCandidate) {
          const enc = encodeURIComponent(addressCandidate);
          deg = await tryFetch(`${QIBLA_BASE_URL}/?address=${enc}`);
        }
        // 4) Fallback umum (Jakarta) agar tetap tampil
        if (deg == null) {
          deg = await tryFetch(`${QIBLA_BASE_URL}/Jakarta`);
        }

        // Jika API tetap gagal tetapi koordinat ada, hitung manual arah kiblat
        if (deg == null && latitude && longitude) {
          const toRad = (v) => (v * Math.PI) / 180;
          const toDeg = (v) => (v * 180) / Math.PI;
          const kaabaLat = toRad(21.4225);
          const kaabaLng = toRad(39.8262);
          const lat1 = toRad(latitude);
          const lng1 = toRad(longitude);
          const dLng = kaabaLng - lng1;
          const y = Math.sin(dLng) * Math.cos(kaabaLat);
          const x =
            Math.cos(lat1) * Math.sin(kaabaLat) -
            Math.sin(lat1) * Math.cos(kaabaLat) * Math.cos(dLng);
          const brng = Math.atan2(y, x);
          const bearingDeg = (toDeg(brng) + 360) % 360;
          deg = bearingDeg;
        }

        if (deg != null) {
          setDirection(deg);
          return;
        }
        setError("Gagal memuat arah kiblat");
      } catch {
        setError("Gagal memuat arah kiblat");
      } finally {
        setLoading(false);
      }
    };

    loadQibla();
  }, []);

  useEffect(() => {
    let subscription;
    const startHeadingWatch = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }
        subscription = await Location.watchHeadingAsync((data) => {
          const value =
            typeof data.trueHeading === "number" && data.trueHeading >= 0
              ? data.trueHeading
              : data.magHeading;
          if (typeof value === "number" && !Number.isNaN(value)) {
            setHeading(value);
          }
        });
      } catch {
      }
    };
    startHeadingWatch();
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const directionText =
    direction != null ? `${Math.round(direction)}° dari utara` : "-";
  const pointerRotation =
    direction != null && heading != null
      ? (direction - heading + 360) % 360
      : 0;

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arah Kiblat</Text>
        <Text style={styles.headerLocation}>
          {locationLabel || "Mencari lokasi..."}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.compassCard}>
          <View style={styles.compassDial}>
            <Ionicons
              name="compass"
              size={72}
              color={PRIMARY_COLOR}
              style={styles.compassIcon}
            />
            <View
              style={[
                styles.kaabaPointerContainer,
                { transform: [{ rotate: `${pointerRotation}deg` }] },
              ]}
            >
              <View style={styles.kaabaPointerLine} />
              <Ionicons
                name="cube"
                size={18}
                color={PRIMARY_COLOR}
                style={styles.kaabaIcon}
              />
            </View>
            <Text style={styles.northLabel}>N</Text>
          </View>
          <Text style={styles.directionValue}>
            {direction != null ? `${Math.round(direction)}°` : "–"}
          </Text>
          <Text style={styles.directionLabel}>Dari utara ke arah kiblat</Text>
          {coords && (
            <Text style={styles.coordText}>
              {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Petunjuk</Text>
          <Text style={styles.infoText}>
            Hadapkan bagian atas ponsel ke arah yang ditunjukkan, lalu
            sejajarkan tubuhmu ke arah kiblat.
          </Text>
          <Text style={styles.infoText}>
            Gunakan garis imajiner dari utara (0°) menuju {directionText}.
          </Text>
        </View>

        {loading && <Text style={styles.statusText}>Memuat arah kiblat…</Text>}
        {!loading && !!error && (
          <Text style={styles.statusTextError}>{error}</Text>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {[
          { label: "Home", icon: "home", route: "Home" },
          { label: "Shalat", icon: "time", route: "Shalat" },
          { label: "Qiblat", icon: "compass", route: "Qiblat" },
          { label: "Quran", icon: "book", route: "Quran" },
        ].map((item) => {
          const isActive = item.label === "Qiblat";
          return (
            <TouchableOpacity
              key={item.label}
              style={styles.bottomItem}
              onPress={() => {
                if (item.route && !isActive) {
                  navigation.navigate(item.route);
                }
              }}
            >
              <Ionicons
                name={isActive ? `${item.icon}` : `${item.icon}-outline`}
                size={22}
                color={isActive ? PRIMARY_COLOR : "#9CA3AF"}
              />
              <Text
                style={[
                  styles.bottomLabel,
                  isActive && styles.bottomLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default Qiblat;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F4F4F5",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: PRIMARY_COLOR,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerLocation: {
    fontSize: 13,
    color: "#E5E7EB",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 90,
  },
  compassCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  compassDial: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  compassIcon: {
    marginBottom: 0,
  },
  kaabaPointerContainer: {
    position: "absolute",
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  kaabaPointerLine: {
    width: 2,
    height: 26,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 999,
  },
  kaabaIcon: {
    marginTop: 4,
  },
  northLabel: {
    position: "absolute",
    top: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  directionValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
  },
  directionLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  coordText: {
    marginTop: 8,
    fontSize: 12,
    color: "#9CA3AF",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  statusTextError: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 4,
  },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bottomItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  bottomLabel: {
    fontSize: 11,
    marginTop: 2,
    color: "#9CA3AF",
  },
  bottomLabelActive: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
});
