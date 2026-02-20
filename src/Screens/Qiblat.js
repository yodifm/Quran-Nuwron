import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import {
    BackHandler,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Kabah from "../assets/Illustration/Kabah.svg";

const PRIMARY_COLOR = "#3B82F6";
const QIBLA_BASE_URL = "https://time.siswadi.com/qibla";
const MYQURAN_QIBLA_BASE = "https://api.myquran.com/v3/qibla";

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

        // Tampilkan arah kiblat lokal segera agar tidak terasa lambat
        try {
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
          setDirection(bearingDeg);
          setLoading(false);
        } catch {}

        const extractDeg = (data) => {
          if (!data || typeof data !== "object") return null;
          const d =
            (data.data &&
              (data.data.direction ?? data.data.deg ?? data.data.bearing)) ??
            data.direction ??
            data.deg ??
            data.bearing ??
            (data.qibla &&
              (data.qibla.direction ?? data.qibla.deg ?? data.qibla.bearing)) ??
            (data.data &&
              (data.data.derajat ??
                data.data.degree ??
                data.data.qibla_degree)) ??
            data.derajat ??
            data.degree ??
            data.qibla_degree;
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
        deg =
          (await tryFetch(
            `${MYQURAN_QIBLA_BASE}?lat=${latitude}&lon=${longitude}`,
          )) ??
          (await tryFetch(
            `${MYQURAN_QIBLA_BASE}?latitude=${latitude}&longitude=${longitude}`,
          )) ??
          (await tryFetch(`${MYQURAN_QIBLA_BASE}/${latitude}/${longitude}`));
        if (deg == null) {
          deg = await tryFetch(`${QIBLA_BASE_URL}/${latitude}/${longitude}`);
        }
        if (deg == null) {
          deg = await tryFetch(
            `${QIBLA_BASE_URL}/?lat=${latitude}&lng=${longitude}`,
          );
        }
        if (deg == null && addressCandidate) {
          const enc = encodeURIComponent(addressCandidate);
          deg = await tryFetch(`${QIBLA_BASE_URL}/?address=${enc}`);
        }
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
      } catch {}
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
  const rotationGuide = (() => {
    if (direction == null || heading == null) return null;
    const delta = (direction - heading + 360) % 360;
    const amount = delta <= 180 ? delta : 360 - delta;
    const side = delta <= 180 ? "kanan" : "kiri";
    return `Putar ponsel ${Math.round(amount)}° ke ${side}`;
  })();

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
            <View style={styles.ring} />
            <Text style={[styles.cardinalLabel, styles.cardinalN]}>N</Text>
            <Text style={[styles.cardinalLabel, styles.cardinalE]}>E</Text>
            <Text style={[styles.cardinalLabel, styles.cardinalS]}>S</Text>
            <Text style={[styles.cardinalLabel, styles.cardinalW]}>W</Text>
            <View style={[styles.dot, styles.dotTop]} />
            <View style={[styles.dot, styles.dotRight]} />
            <View style={[styles.dot, styles.dotBottom]} />
            <View style={[styles.dot, styles.dotLeft]} />
            <View style={styles.centerOverlay}>
              <View
                style={[
                  styles.kaabaPointerContainer,
                  { transform: [{ rotate: `${pointerRotation}deg` }] },
                ]}
              >
                <View style={styles.kaabaIcon}>
                  <Kabah width={26} height={26} />
                </View>
              </View>
            </View>
            <View style={styles.pivot} />
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
          {!!rotationGuide && (
            <Text style={styles.guideText}>{rotationGuide}</Text>
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

        <TouchableOpacity
          style={styles.nearestBtn}
          onPress={() => navigation.navigate("NearestMosque")}
        >
          <Ionicons name="location" size={18} color="#FFFFFF" />
          <Text style={styles.nearestBtnText}>Find nearest mosque</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}>
        {[
          { label: "Home", icon: "home", route: "Home" },
          { label: "Shalat", icon: "time", route: "Shalat" },
          { label: "Quran", icon: "book", route: "Quran" },
          { label: "Qiblat", icon: "compass", route: "Qiblat" },
          { label: "Game", icon: "game-controller", route: "Game" },
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
              <View style={[styles.tabCircle, isActive && styles.tabCircleActive]}>
                <Ionicons
                  name={isActive ? `${item.icon}` : `${item.icon}-outline`}
                  size={22}
                  color={isActive ? "#FFFFFF" : "#9CA3AF"}
                />
              </View>
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 12,
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
    paddingBottom: 120,
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
  ring: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    borderColor: "#DBEAFE",
  },
  pivot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY_COLOR,
  },
  cardinalLabel: {
    position: "absolute",
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  cardinalN: { top: -6 },
  cardinalE: { right: -10 },
  cardinalS: { bottom: -6 },
  cardinalW: { left: -10 },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
  },
  dotTop: { top: 20 },
  dotRight: { right: 20 },
  dotBottom: { bottom: 20 },
  dotLeft: { left: 20 },
  compassIcon: {
    marginBottom: 0,
  },
  centerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  kaabaPointerContainer: {
    height: 110,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  kaabaIcon: {
    marginTop: -2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
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
  guideText: {
    marginTop: 8,
    fontSize: 12,
    color: "#1E3A8A",
    fontWeight: "600",
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
  nearestBtn: {
    marginTop: 16,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 999,
    paddingVertical: 10,
  },
  nearestBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
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
  tabCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  tabCircleActive: {
    backgroundColor: PRIMARY_COLOR,
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
