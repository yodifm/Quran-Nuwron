import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import * as Linking from "expo-linking";
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
const GEOAPIFY_URL = "https://api.geoapify.com/v2/places";

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

const fetchGeoapify = async (latitude, longitude, radius, apiKey) => {
  const params = {
    categories: "religion.place_of_worship.mosque",
    filter: `circle:${longitude},${latitude},${radius}`,
    bias: `proximity:${longitude},${latitude}`,
    limit: 20,
    apiKey,
  };
  const res = await axios.get(GEOAPIFY_URL, { params, timeout: 12000 });
  const features = Array.isArray(res.data?.features) ? res.data.features : [];
  return features
    .map((f) => {
      const props = f.properties || {};
      const lat = props.lat;
      const lon = props.lon;
      if (typeof lat !== "number" || typeof lon !== "number") return null;
      const distance = haversineKm(latitude, longitude, lat, lon);
      const name =
        props.name ||
        props.address_line2 ||
        props.street ||
        "Masjid tanpa nama";
      const addressParts = [props.address_line1, props.address_line2]
        .filter(Boolean)
        .join(", ");
      return {
        id: props.place_id || `${lat},${lon}`,
        name,
        address: addressParts,
        distance,
        lat,
        lon,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
};

const fetchOverpass = async (latitude, longitude, radius) => {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${radius},${latitude},${longitude})["amenity"="place_of_worship"];
      way(around:${radius},${latitude},${longitude})["amenity"="place_of_worship"];
      relation(around:${radius},${latitude},${longitude})["amenity"="place_of_worship"];
    );
    out center 60;
  `;
  const res = await axios.post(OVERPASS_URL, query, {
    headers: { "Content-Type": "text/plain" },
    timeout: 8000,
  });
  const elements = Array.isArray(res.data?.elements) ? res.data.elements : [];
  return elements
    .map((el) => {
      const lat = typeof el.lat === "number" ? el.lat : el.center?.lat;
      const lon = typeof el.lon === "number" ? el.lon : el.center?.lon;
      if (typeof lat !== "number" || typeof lon !== "number") return null;
      const distance = haversineKm(latitude, longitude, lat, lon);
      const tags = el.tags || {};
      const rawName = tags.name || tags["name:id"] || tags["name:en"] || "";
      const name =
        rawName && /masjid|mushola|musholla|mushola/i.test(rawName)
          ? rawName
          : tags.religion === "muslim"
          ? rawName || "Masjid tanpa nama"
          : "";
      const street = tags["addr:street"] || "";
      const suburb = tags.suburb || "";
      const city = tags.city || tags.town || "";
      const addressParts = [street, suburb, city].filter(Boolean);
      const address = addressParts.join(", ");
      return name
        ? {
        id: el.id,
        name,
        address,
        distance,
        lat,
        lon,
      }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
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
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 30000,
          timeout: 8000,
        });
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        const radiusSmall = 1500;
        const radiusLarge = 3000;
        const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_KEY;
        const attempt = async (r) => {
          const tasks = [];
          if (apiKey) tasks.push(fetchGeoapify(latitude, longitude, r, apiKey));
          tasks.push(fetchOverpass(latitude, longitude, r));
          const settled = await Promise.allSettled(tasks);
          let combined = [];
          for (const s of settled) {
            if (s.status === "fulfilled" && Array.isArray(s.value)) {
              combined = combined.concat(s.value);
            }
          }
          combined.sort((a, b) => a.distance - b.distance);
          const key = (m) =>
            `${(m.name || "").toLowerCase()}_${Math.round(m.lat * 1e5)}_${Math.round(
              m.lon * 1e5,
            )}`;
          const seen = new Set();
          const uniq = [];
          for (const m of combined) {
            const k = key(m);
            if (!seen.has(k)) {
              seen.add(k);
              uniq.push(m);
            }
          }
          return uniq;
        };

        let results = await attempt(radiusSmall);
        if (results.length < 5) {
          const more = await attempt(radiusLarge);
          results = more;
        }
        results = results.slice(0, 5);
        if (!results.length) {
          setError("Tidak ditemukan masjid dalam radius 3 km");
          return;
        }
        setMosques(results);
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
                  <MaterialCommunityIcons name="mosque" size={18} color={PRIMARY_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mosqueName}>{m.name}</Text>
                  {!!m.address && (
                    <Text style={styles.mosqueAddress}>{m.address}</Text>
                  )}
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    {m.distance < 1
                      ? `${Math.round(m.distance * 1000)} m`
                      : `${m.distance.toFixed(1)} km`}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    const label = encodeURIComponent(m.name || "Masjid");
                    const url =
                      Platform.OS === "android"
                        ? `geo:${m.lat},${m.lon}?q=${m.lat},${m.lon}(${label})`
                        : `http://maps.apple.com/?ll=${m.lat},${m.lon}&q=${label}`;
                    Linking.openURL(url);
                  }}
                >
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Arah</Text>
                </TouchableOpacity>
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
    gap: 10,
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
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
