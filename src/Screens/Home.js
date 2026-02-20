import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native";
import Bedug from "../assets/Illustration/Bedug.svg";
const BASE_URL = "https://api.myquran.com/v1/sholat";
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
  const [province, setProvince] = useState("");
  const [kabkota, setKabkota] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [checked, setChecked] = useState({
    subuh: false,
    dzuhur: false,
    ashar: false,
    maghrib: false,
    isya: false,
  });
  const quotes = [
    "Sesungguhnya salat mencegah dari perbuatan keji dan mungkar. (QS. Al-‘Ankabut: 45)",
    "Sesungguhnya salat itu fardhu bagi orang beriman pada waktunya. (QS. An-Nisa: 103)",
    "Mintalah pertolongan dengan sabar dan salat. (QS. Al-Baqarah: 45)",
    "Perjanjian antara kami dengan orang kafir adalah salat; siapa meninggalkan salat maka ia kafir. (HR. Ahmad, Abu Daud)",
  ];
  const reverseCityFromCoordsWeb = async (coords) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`;
      const res = await fetch(url);
      const data = await res.json();
      const addr = data?.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.municipality ||
        "";
      const state = addr.state || addr.region || addr.province || "";
      return { city, state };
    } catch {
      return null;
    }
  };
  const toggleCheck = (key) => {
    setChecked((prev) => {
      const nextVal = !prev[key];
      const next = { ...prev, [key]: nextVal };
      if (nextVal) {
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        Alert.alert("Kutipan Religi", q);
      }
      return next;
    });
  };

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

  const refreshLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (Platform.OS === "web") {
          setKabkota((prev) => prev || "Bekasi");
          setProvince((prev) => prev || "Jawa Barat");
          setLocationLabel((prev) => prev || "Bekasi, Jawa Barat");
        }
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      if (Platform.OS === "web") {
        const rev = await reverseCityFromCoordsWeb(position.coords);
        if (rev && (rev.city || rev.state)) {
          const cityLabel = rev.city || "Bekasi";
          const stateLabel = rev.state || "Jawa Barat";
          setLocationLabel(`${cityLabel}, ${stateLabel}`);
          setKabkota(cityLabel);
          setProvince(stateLabel);
        } else {
          setKabkota("Bekasi");
          setProvince("Jawa Barat");
          setLocationLabel("Bekasi, Jawa Barat");
        }
      } else {
        const places = await Location.reverseGeocodeAsync(position.coords);
        const place = places[0];
        if (place) {
          const rawCity = place.city || "";
          const rawSubregion = place.subregion || "";
          const regionName = place.region || rawSubregion || "";
          const cityCandidate = rawCity || rawSubregion;
          if (cityCandidate || regionName) {
            const label =
              cityCandidate && regionName
                ? `${cityCandidate}, ${regionName}`
                : cityCandidate || regionName;
            setLocationLabel(label);
          }
          if (regionName) {
            setProvince(regionName);
          }
          if (cityCandidate) {
            setKabkota(cityCandidate);
          }
        }
      }
    } catch {
    } finally {
      setLocationLoading(false);
    }
  };
 
  useEffect(() => {
    const loadLocation = async () => {
      try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (Platform.OS === "web") {
            setKabkota((prev) => prev || "Bekasi");
            setProvince((prev) => prev || "Jawa Barat");
            setLocationLabel((prev) => prev || "Bekasi, Jawa Barat");
          }
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        if (Platform.OS === "web") {
          const rev = await reverseCityFromCoordsWeb(position.coords);
          if (rev && (rev.city || rev.state)) {
            const cityLabel = rev.city || "Bekasi";
            const stateLabel = rev.state || "Jawa Barat";
            setLocationLabel(`${cityLabel}, ${stateLabel}`);
            setKabkota(cityLabel);
            setProvince(stateLabel);
          } else {
            setKabkota((prev) => prev || "Bekasi");
            setProvince((prev) => prev || "Jawa Barat");
            setLocationLabel((prev) => prev || "Bekasi, Jawa Barat");
          }
        } else {
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
              setKabkota(kabSource);
            }
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
        if (!kabkota) {
          setLoading(false);
          return;
        }
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const all = await axios.get(`${BASE_URL}/kota/semua`);
        const list = all.data?.data || [];
        const normalizedKab = String(kabkota)
          .toLowerCase()
          .replace(/^kota\s+/i, "")
          .replace(/^kab(?:\.|upaten)\s+/i, "")
          .replace(/\s+city$/i, "");
        const match =
          list.find((x) =>
            String(x.lokasi || x.nama || "")
              .toLowerCase()
              .includes(normalizedKab),
          ) ||
          list.find((x) =>
            String(x.lokasi || x.nama || "")
              .toLowerCase()
              .includes(String(province).toLowerCase()),
          );
        const cityId = match?.id || match?.kode || null;
        if (!cityId) {
          setError("Kota untuk jadwal sholat tidak ditemukan");
          return;
        }
        const url = `${BASE_URL}/jadwal/${cityId}/${year}/${month}/${day}`;
        const res = await axios.get(url);
        const d = res.data?.data;
        const jadwal = d?.jadwal || null;
        if (jadwal && typeof jadwal === "object") {
          setTodaySchedule(jadwal);
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

  const [lastTriggered, setLastTriggered] = useState(null);
  useEffect(() => {
    if (!todaySchedule) return;
    const mapping = {
      subuh: todaySchedule.subuh || todaySchedule.Subuh,
      dzuhur: todaySchedule.dzuhur || todaySchedule.Dzuhur,
      ashar: todaySchedule.ashar || todaySchedule.Ashar,
      maghrib: todaySchedule.maghrib || todaySchedule.Maghrib,
      isya: todaySchedule.isya || todaySchedule.Isya,
    };
    for (const [key, timeStr] of Object.entries(mapping)) {
      const t = parseTimeToday(timeStr);
      if (!t) continue;
      const diff = now.getTime() - t.getTime();
      if (diff >= 0 && diff < 60000 && lastTriggered !== key) {
        const title =
          key === "dzuhur"
            ? "Waktu Sholat Dzuhur"
            : key === "subuh"
            ? "Waktu Sholat Subuh"
            : key === "ashar"
            ? "Waktu Sholat Ashar"
            : key === "maghrib"
            ? "Waktu Sholat Maghrib"
            : "Waktu Sholat Isya'";
        const q =
          "“Perjanjian antara kami dengan orang kafir adalah sholat. Barangsiapa yang meninggalkan sholat maka ia telah kafir.”\nHR. Ahmad, Abu Daud";
        Alert.alert(title, `Telah tiba pada pukul ${timeStr}\n\n${q}`, [
          { text: "Tutup" },
        ]);
        setLastTriggered(key);
        break;
      }
    }
  }, [now, todaySchedule, lastTriggered]);

  const [doas, setDoas] = useState([]);
  const [doaLoading, setDoaLoading] = useState(false);
  useEffect(() => {
    const fetchDoa = async () => {
      try {
        setDoaLoading(true);
        const res = await axios.get("https://equran.id/api/doa");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setDoas(data);
      } catch {
        setDoas([]);
      } finally {
        setDoaLoading(false);
      }
    };
    fetchDoa();
  }, []);

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
          <TouchableOpacity onPress={refreshLocation}>
            <Ionicons name="locate-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
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
              { label: "Subuh", key: "subuh" },
              { label: "Dzuhur", key: "dzuhur" },
              { label: "Ashar", key: "ashar" },
              { label: "Maghrib", key: "maghrib" },
              { label: "Isya'", key: "isya" },
            ].map((item) => (
              <Pressable
                key={item.key}
                style={styles.trackerItem}
                onPress={() => toggleCheck(item.key)}
                hitSlop={10}
              >
                <Ionicons
                  name={checked[item.key] ? "checkbox" : "checkbox-outline"}
                  size={20}
                  color={PRIMARY_COLOR}
                />
                <Text style={styles.trackerLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <TouchableOpacity style={styles.trackerButton}>
            <Text style={styles.trackerButtonText}>Prayer Together</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Prayer</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Doa")}>
            <Text style={styles.sectionAction}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {(doaLoading ? Array.from({ length: 4 }) : doas.slice(0, 4)).map(
            (item, idx) => {
              const label =
                item?.judul ||
                item?.title ||
                item?.nama ||
                `Doa ${idx + 1}`;
              const id = item?.id;
              return (
                <TouchableOpacity
                  key={label}
                  style={styles.gridItem}
                  onPress={() => {
                    if (id) {
                      navigation.navigate("DoaDetail", { id });
                    }
                  }}
                >
                  <Ionicons
                    name="book-outline"
                    size={24}
                    color={PRIMARY_COLOR}
                  />
                  <Text style={styles.gridLabel}>{label}</Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {[
          { label: "Home", icon: "home", route: "Home" },
          { label: "Shalat", icon: "time", route: "Shalat" },
          { label: "Quran", icon: "book", route: "Quran" },
          { label: "Qiblat", icon: "compass", route: "Qiblat" },
          { label: "Game", icon: "game-controller", route: "Game" },
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
