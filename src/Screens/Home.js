import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import Bedug from "../assets/Illustration/Bedug.svg";
const BASE_URL = "https://equran.id/api/v2/shalat";
const PRIMARY_COLOR = "#0000FF";

const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const parseTimeToday = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const diffLabel = (from, to) => {
  if (!from || !to) return "";
  const ms = to.getTime() - from.getTime();
  if (ms <= 0) return "Now";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${minutes}m`;
};

const Home = ({ navigation }) => {
  const [now, setNow] = useState(new Date());
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [province, setProvince] = useState("Jawa Timur");
  const [kabkota, setKabkota] = useState("Kota Malang");
  const [locationLabel, setLocationLabel] = useState("Malang, East Java");
  const [locationLoading, setLocationLoading] = useState(false);

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
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        const places = await Location.reverseGeocodeAsync(position.coords);
        const place = places[0];
        if (place) {
          const rawCity = place.city || "";
          const rawSubregion = place.subregion || "";
          const regionName = place.region || rawSubregion || "";

          const labelCityPart = rawCity || rawSubregion;
          if (labelCityPart || regionName) {
            const label =
              labelCityPart && regionName
                ? `${labelCityPart}, ${regionName}`
                : labelCityPart || regionName;
            setLocationLabel(label);
          }

          if (regionName) {
            setProvince(regionName);
          }

          const kabSource = rawSubregion || rawCity;
          if (kabSource) {
            const lower = kabSource.toLowerCase();
            let apiKabkota = kabSource;
            if (lower.startsWith("kabupaten")) {
              apiKabkota = kabSource.replace(/^Kabupaten\s+/i, "Kab. ");
            } else if (!lower.startsWith("kab.") && !lower.startsWith("kota")) {
              apiKabkota = `Kota ${kabSource}`;
            }
            setKabkota(apiKabkota);
          }
        }
      } catch {
      } finally {
        setLocationLoading(false);
      }
    };

    loadLocation();
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError("");
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const response = await axios.post(BASE_URL, {
          provinsi: province,
          kabkota: kabkota,
          bulan: month,
          tahun: year,
        });

        const data = response.data?.data;
        const todayStr = today.toISOString().slice(0, 10);
        const todayItem = data?.jadwal?.find(
          (item) => item.tanggal_lengkap === todayStr,
        );
        if (todayItem) {
          setTodaySchedule(todayItem);
        } else {
          setError("Jadwal hari ini tidak ditemukan");
        }
      } catch {
        setError("Gagal memuat jadwal shalat");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [province, kabkota]);

  const prayerItems = useMemo(() => {
    if (!todaySchedule) {
      return [
        { label: "Subuh", key: "subuh", time: "" },
        { label: "Dzuhur", key: "dzuhur", time: "" },
        { label: "Ashar", key: "ashar", time: "" },
        { label: "Maghrib", key: "maghrib", time: "" },
        { label: "Isya'", key: "isya", time: "" },
      ];
    }
    return [
      { label: "Subuh", key: "subuh", time: todaySchedule.subuh },
      { label: "Dzuhur", key: "dzuhur", time: todaySchedule.dzuhur },
      { label: "Ashar", key: "ashar", time: todaySchedule.ashar },
      { label: "Maghrib", key: "maghrib", time: todaySchedule.maghrib },
      { label: "Isya'", key: "isya", time: todaySchedule.isya },
    ];
  }, [todaySchedule]);

  const nextPrayerInfo = useMemo(() => {
    if (!todaySchedule) return null;
    const order = [
      { key: "subuh", label: "Subuh", time: todaySchedule.subuh },
      { key: "dzuhur", label: "Dzuhur", time: todaySchedule.dzuhur },
      { key: "ashar", label: "Ashar", time: todaySchedule.ashar },
      { key: "maghrib", label: "Maghrib", time: todaySchedule.maghrib },
      { key: "isya", label: "Isya'", time: todaySchedule.isya },
    ];

    for (const item of order) {
      const t = parseTimeToday(item.time);
      if (t && t.getTime() >= now.getTime()) {
        return {
          label: item.label,
          time: item.time,
          diff: diffLabel(now, t),
        };
      }
    }
    return null;
  }, [now, todaySchedule]);

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.locationLabel}>Location</Text>
            <Text style={styles.locationValue}>
              {locationLoading ? "Detecting location..." : locationLabel}
            </Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color="#6B7280" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Start your day with these prayers
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>

        <View style={styles.prayerTimeCard}>
          <View>
            <Text style={styles.hijriDate}>
              {todaySchedule?.hari} {todaySchedule?.tanggal_lengkap ?? ""}
            </Text>
            <Text style={styles.mainTime}>{formatTime(now)}</Text>
            <Text style={styles.subTime}>
              {nextPrayerInfo
                ? `${nextPrayerInfo.label} in ${nextPrayerInfo.diff}`
                : loading
                  ? "Loading schedule..."
                  : error || "Jadwal selesai untuk hari ini"}
            </Text>
          </View>
          <Bedug width={72} height={72} />
        </View>

        <View style={styles.prayerRow}>
          {prayerItems.map((item) => {
            const isActive =
              nextPrayerInfo && nextPrayerInfo.label === item.label;
            return (
              <View key={item.label} style={styles.prayerItem}>
                <Ionicons
                  name={isActive ? "sunny" : "sunny-outline"}
                  size={22}
                  color={isActive ? PRIMARY_COLOR : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.prayerLabel,
                    isActive && styles.prayerLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.prayerTime}>
                  {item.time || (loading ? "..." : "-")}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.trackerCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="alarm-outline" size={18} color="#111827" />
              <Text style={styles.cardTitle}>Prayer Tracker</Text>
            </View>
            <Ionicons name="share-social-outline" size={18} color="#9CA3AF" />
          </View>
          <View style={styles.trackerRow}>
            {[
              { label: "Subuh", done: true },
              { label: "Dzuhur", done: true },
              { label: "Ashar", done: true },
              { label: "Maghrib", done: false },
              { label: "Isya'", done: false },
            ].map((item) => (
              <View key={item.label} style={styles.trackerItem}>
                <View
                  style={[
                    styles.trackerCircle,
                    item.done
                      ? styles.trackerCircleDone
                      : styles.trackerCirclePending,
                  ]}
                >
                  {item.done && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.trackerLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.trackerButton}>
            <Text style={styles.trackerButtonText}>Prayer Together</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Prayer</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {[
            "Prayer for eating",
            "Study prayer",
            "Bedtime prayers",
            "Morning prayers",
          ].map((label) => (
            <TouchableOpacity key={label} style={styles.gridItem}>
              <Ionicons name="book-outline" size={24} color={PRIMARY_COLOR} />
              <Text style={styles.gridLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {[
          { label: "Home", icon: "home", route: "Home" },
          { label: "Shalat", icon: "time", route: "Shalat" },
          { label: "Qiblat", icon: "compass", route: "Qiblat" },
          { label: "Quran", icon: "book", route: "Quran" },
        ].map((item) => {
          const isActive = item.label === "Home";
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

export default Home;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F4F4F5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 90,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  locationValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  trackerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  prayerTimeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  hijriDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  mainTime: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111827",
  },
  subTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  prayerRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  prayerItem: {
    alignItems: "center",
    flex: 1,
  },
  prayerLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  prayerLabelActive: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  prayerTime: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trackerRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  trackerItem: {
    alignItems: "center",
    marginHorizontal: 2,
  },
  trackerCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  trackerCircleDone: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: PRIMARY_COLOR,
  },
  trackerCirclePending: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: "transparent",
  },
  trackerLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  trackerButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 255, 0.08)",
    alignItems: "center",
  },
  trackerButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: PRIMARY_COLOR,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  sectionAction: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    gap: 8,
  },
  gridLabel: {
    fontSize: 13,
    color: "#111827",
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
