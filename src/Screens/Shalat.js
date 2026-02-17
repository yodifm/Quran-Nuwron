import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BackHandler,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BASE_URL = "https://equran.id/api/v2/shalat";
const PRIMARY_COLOR = "#0000FF";

const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const Shalat = ({ navigation }) => {
  const [now, setNow] = useState(new Date());
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [province, setProvince] = useState("Jawa Timur");
  const [kabkota, setKabkota] = useState("Kota Malang");
  const [locationLabel, setLocationLabel] = useState("Malang, East Java");

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
      } catch {}
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

  const rows = useMemo(() => {
    if (!todaySchedule) {
      return [
        { key: "imsak", label: "Imsak", icon: "moon", time: "" },
        { key: "subuh", label: "Subuh", icon: "moon-outline", time: "" },
        { key: "dhuha", label: "Dhuha", icon: "sunny-outline", time: "" },
        { key: "dzuhur", label: "Dzuhur", icon: "sunny", time: "" },
        { key: "ashar", label: "Ashar", icon: "sunny-outline", time: "" },
        { key: "maghrib", label: "Maghrib", icon: "moon-outline", time: "" },
        { key: "isya", label: "Isya'", icon: "moon", time: "" },
      ];
    }
    return [
      { key: "imsak", label: "Imsak", icon: "moon", time: todaySchedule.imsak },
      {
        key: "subuh",
        label: "Subuh",
        icon: "moon-outline",
        time: todaySchedule.subuh,
      },
      {
        key: "dhuha",
        label: "Dhuha",
        icon: "sunny-outline",
        time: todaySchedule.dhuha,
      },
      {
        key: "dzuhur",
        label: "Dzuhur",
        icon: "sunny",
        time: todaySchedule.dzuhur,
      },
      {
        key: "ashar",
        label: "Ashar",
        icon: "sunny-outline",
        time: todaySchedule.ashar,
      },
      {
        key: "maghrib",
        label: "Maghrib",
        icon: "moon-outline",
        time: todaySchedule.maghrib,
      },
      {
        key: "isya",
        label: "Isya'",
        icon: "moon",
        time: todaySchedule.isya,
      },
    ];
  }, [todaySchedule]);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerLocation}>{locationLabel}</Text>
        <Text style={styles.headerTime}>{formatTime(now)}</Text>
        <Text style={styles.headerSub}>
          {loading
            ? "Loading schedule..."
            : error || "Stay consistent in your prayers"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dateCard}>
          <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
          <View>
            <Text style={styles.dateLabel}>Today</Text>
            <Text style={styles.dateValue}>
              {todaySchedule?.hari} {todaySchedule?.tanggal_lengkap ?? ""}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Prayer</Text>
            <Text style={styles.tableHeaderText}>Time</Text>
            <Text style={styles.tableHeaderTextRight}>Reminder</Text>
          </View>
          {rows.map((item) => (
            <View key={item.key} style={styles.tableRow}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={PRIMARY_COLOR}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <Text style={styles.rowTime}>
                {item.time || (loading ? "..." : "-")}
              </Text>
              <TouchableOpacity style={styles.reminderButton}>
                <Text style={styles.reminderText}>Reminder Me</Text>
              </TouchableOpacity>
            </View>
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
          const isActive = item.label === "Shalat";
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

export default Shalat;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F4F4F5",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: PRIMARY_COLOR,
  },
  headerLocation: {
    fontSize: 14,
    color: "#E5E7EB",
    marginBottom: 4,
  },
  headerTime: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "#E5E7EB",
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 90,
  },
  dateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  tableHeaderTextRight: {
    flex: 1.2,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    marginRight: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: "#111827",
  },
  rowTime: {
    flex: 0.8,
    fontSize: 13,
    color: "#111827",
    textAlign: "center",
  },
  reminderButton: {
    flex: 1.2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    backgroundColor: "rgba(0, 0, 255, 0.05)",
    alignItems: "center",
  },
  reminderText: {
    fontSize: 11,
    fontWeight: "500",
    color: PRIMARY_COLOR,
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
