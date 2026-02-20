import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY_COLOR = "#3B82F6";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const NearestMosque = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mosques, setMosques] = useState([]);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const load = async () => {
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

        const radius = 3000;
        const query = `
          [out:json];
          node(around:${radius},${latitude},${longitude})["amenity"="place_of_worship"]["religion"="muslim"];
          out center 30;
        `;
        const res = await axios.post(OVERPASS_URL, query, {
          headers: { "Content-Type": "text/plain" },
          timeout: 15000,
        });
        const elements = Array.isArray(res.data?.elements)
          ? res.data.elements
          : [];

        const mapped = elements
          .map((el) => {
            const lat = el.lat;
            const lon = el.lon;
            if (typeof lat !== "number" || typeof lon !== "number") {
              return null;
            }
            const distance = haversineKm(latitude, longitude, lat, lon);
            const tags = el.tags || {};
            const name =
              tags.name ||
              tags["name:en"] ||
              tags["name:id"] ||
              "Masjid tanpa nama";
            const street = tags["addr:street"] || "";
            const suburb = tags.suburb || "";
            const city = tags.city || tags.town || "";
            const addressParts = [street, suburb, city].filter(Boolean);
            const address = addressParts.join(", ");
            return {
              id: el.id,
              name,
              address,
              distance,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 15);

        if (!mapped.length) {
          setError("Tidak ditemukan masjid dalam radius 3 km");
          return;
        }
        setMosques(mapped);
      } catch {
        setError("Gagal memuat daftar masjid terdekat");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Masjid Terdekat</Text>
          {coords && (
            <Text style={styles.headerSub}>
              Berdasarkan lokasi saat ini ({coords.latitude.toFixed(3)},{" "}
              {coords.longitude.toFixed(3)})
            </Text>
          )}
        </View>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Find nearest mosque</Text>
            <Text style={styles.heroSub}>
              Daftar masjid dalam radius sekitar lokasi kamu.
            </Text>
          </View>
          <Ionicons name="navigate" size={28} color={PRIMARY_COLOR} />
        </View>

        {loading && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
            <Text style={styles.statusText}>Mencari masjid terdekat…</Text>
          </View>
        )}

        {!loading && !!error && (
          <Text style={styles.statusTextError}>{error}</Text>
        )}

        {!loading &&
          !error &&
          mosques.map((m) => (
            <View key={m.id} style={styles.mosqueCard}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.iconCircle}>
                  <Ionicons name="home" size={18} color={PRIMARY_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mosqueName}>{m.name}</Text>
                  {!!m.address && (
                    <Text style={styles.mosqueAddress}>{m.address}</Text>
                  )}
                </View>
                <Text style={styles.distanceText}>
                  {m.distance < 1
                    ? `${Math.round(m.distance * 1000)} m`
                    : `${m.distance.toFixed(1)} km`}
                </Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NearestMosque;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F4F4F5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSub: {
    marginTop: 2,
    fontSize: 11,
    color: "#6B7280",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroCard: {
    marginBottom: 16,
    backgroundColor: "#DBEAFE",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  heroSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#3B82F6",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusTextError: {
    fontSize: 13,
    color: "#DC2626",
  },
  mosqueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  mosqueName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  mosqueAddress: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },
  distanceText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
});
