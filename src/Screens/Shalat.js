import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BackHandler,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BASE_URL = "https://api.myquran.com/v1/sholat";
const PRIMARY_COLOR = "#0000FF";

const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const Shalat = ({ navigation }) => {
  const [now, setNow] = useState(new Date());
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [tomorrowSchedule, setTomorrowSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [province, setProvince] = useState("");
  const [kabkota, setKabkota] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);
  const [reminderSwitch, setReminderSwitch] = useState({});
  const [scheduledIds, setScheduledIds] = useState({});
  const isExpoGo = Constants?.executionEnvironment === "storeClient";
  const getNotificationsModule = useCallback(async () => {
    const mod = await import("expo-notifications");
    return mod;
  }, []);

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
    if (isExpoGo) return;
    (async () => {
      const Notifications = await getNotificationsModule();
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    })();
  }, [isExpoGo, getNotificationsModule]);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          // Biarkan kosong agar UI menampilkan status "Detecting location..."
          return;
        }
        if (Platform.OS === "web") {
          const position = await Location.getCurrentPositionAsync({});
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
          const setFromCoords = async (coords) => {
            const places = await Location.reverseGeocodeAsync(coords);
            const place = places[0];
            if (!place) return;
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
            const lowerRegion = String(regionName).toLowerCase();
            const kecamatan = String(rawSubregion || rawCity).toLowerCase();
            const mapJakarta = () => {
              const west = [
                "cengkareng",
                "grogol petamburan",
                "kalideres",
                "kebon jeruk",
                "kembangan",
                "palmerah",
                "taman sari",
                "tambora",
              ];
              const south = [
                "cilandak",
                "jagakarsa",
                "kebayoran baru",
                "kebayoran lama",
                "mampang prapatan",
                "pancoran",
                "pasar minggu",
                "pesanggrahan",
                "setiabudi",
                "tebet",
              ];
              const east = [
                "cakung",
                "ciracas",
                "duren sawit",
                "jatinegara",
                "kramat jati",
                "makasar",
                "matraman",
                "pasar rebo",
                "pulo gadung",
              ];
              const north = [
                "cilincing",
                "kelapa gading",
                "koja",
                "pademangan",
                "penjaringan",
                "tanjung priok",
              ];
              const center = [
                "cempaka putih",
                "gambir",
                "johar baru",
                "kemayoran",
                "menteng",
                "sawah besar",
                "senen",
                "tanah abang",
              ];
              if (west.some((x) => kecamatan.includes(x))) return "Jakarta Barat";
              if (south.some((x) => kecamatan.includes(x))) return "Jakarta Selatan";
              if (east.some((x) => kecamatan.includes(x))) return "Jakarta Timur";
              if (north.some((x) => kecamatan.includes(x))) return "Jakarta Utara";
              if (center.some((x) => kecamatan.includes(x))) return "Jakarta Pusat";
              return "";
            };
            let kabSource = rawSubregion || rawCity;
            if (lowerRegion.includes("jakarta")) {
              const mapped = mapJakarta();
              if (mapped) kabSource = mapped;
            }
            if (kabSource) {
              setKabkota(kabSource);
            }
          };
          const last = await Location.getLastKnownPositionAsync();
          if (last?.coords) {
            await setFromCoords(last.coords);
          }
          try {
            const fresh = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              maximumAge: 30000,
              timeout: 6000,
            });
            await setFromCoords(fresh.coords);
          } catch {}
        }
      } catch {} finally {
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
        const isJakarta =
          /jakarta/i.test(String(province)) ||
          /jakarta/i.test(String(kabkota));
        const jakartaItem = list.find((x) =>
          /kota\s+jakarta/i.test(String(x.lokasi || x.nama || "")),
        );
        const cityId =
          match?.id ||
          match?.kode ||
          (isJakarta ? jakartaItem?.id || "1301" : null);
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
        const tmw = new Date(today);
        tmw.setDate(today.getDate() + 1);
        const y2 = tmw.getFullYear();
        const m2 = String(tmw.getMonth() + 1).padStart(2, "0");
        const d2 = String(tmw.getDate()).padStart(2, "0");
        try {
          const url2 = `${BASE_URL}/jadwal/${cityId}/${y2}/${m2}/${d2}`;
          const res2 = await axios.get(url2);
          const dres2 = res2.data?.data;
          const jadwal2 = dres2?.jadwal || null;
          setTomorrowSchedule(jadwal2 || null);
        } catch {}
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

  const parseTimeToday = (s) => {
    if (!s || typeof s !== "string") return null;
    const [hh, mm] = s.split(":").map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  };
  const parseTimeForDate = (s, baseDate) => {
    if (!s || typeof s !== "string") return null;
    const [hh, mm] = s.split(":").map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const d = new Date(baseDate);
    d.setHours(hh, mm, 0, 0);
    return d;
  };
  const diffLabel = (from, to) => {
    const diffMs = Math.max(0, to.getTime() - from.getTime());
    const min = Math.floor(diffMs / 60000);
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0) return `${h} jam ${m} mnt`;
    return `${m} mnt`;
  };
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
    if (tomorrowSchedule?.subuh) {
      const base = new Date(now);
      base.setDate(base.getDate() + 1);
      const t = parseTimeForDate(tomorrowSchedule.subuh, base);
      if (t) {
        return {
          label: "Subuh",
          time: tomorrowSchedule.subuh,
          diff: diffLabel(now, t),
        };
      }
    }
    return null;
  }, [now, todaySchedule, tomorrowSchedule]);

  const ensurePermission = useCallback(async () => {
    if (isExpoGo) return false;
    const Notifications = await getNotificationsModule();
    const settings = await Notifications.getPermissionsAsync();
    if (settings.status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      return req.status === "granted";
    }
    return true;
  }, [isExpoGo, getNotificationsModule]);

  const scheduleFor = useCallback(
    async (key, label, time) => {
      if (isExpoGo) {
        const when = parseTimeToday(time);
        if (!when) return null;
        if (when.getTime() <= new Date().getTime()) return null;
        return null;
      }
      const ok = await ensurePermission();
      if (!ok) return null;
      const Notifications = await getNotificationsModule();
      const when = parseTimeToday(time);
      if (!when) return null;
      if (when.getTime() <= new Date().getTime()) return null;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${label}`,
          body: `Waktu ${label} ${time}`,
          sound: "default",
          priority: (Notifications.AndroidNotificationPriority || "high"),
        },
        trigger: when,
      });
      return id;
    },
    [ensurePermission, isExpoGo, getNotificationsModule],
  );

  const cancelFor = useCallback(async (id) => {
    if (!id) return;
    const Notifications = await getNotificationsModule();
    await Notifications.cancelScheduledNotificationAsync(id);
  }, [getNotificationsModule]);

  useEffect(() => {
    if (!todaySchedule) return;
    const keys = Object.keys(reminderSwitch).filter((k) => reminderSwitch[k]);
    const mapTime = {
      imsak: todaySchedule?.imsak,
      subuh: todaySchedule?.subuh,
      dhuha: todaySchedule?.dhuha,
      dzuhur: todaySchedule?.dzuhur,
      ashar: todaySchedule?.ashar,
      maghrib: todaySchedule?.maghrib,
      isya: todaySchedule?.isya,
    };
    const labels = {
      imsak: "Imsak",
      subuh: "Subuh",
      dhuha: "Dhuha",
      dzuhur: "Dzuhur",
      ashar: "Ashar",
      maghrib: "Maghrib",
      isya: "Isya'",
    };
    keys.forEach(async (k) => {
      const existing = scheduledIds[k];
      if (existing) await cancelFor(existing);
      const id = await scheduleFor(k, labels[k], mapTime[k]);
      if (id) setScheduledIds((prev) => ({ ...prev, [k]: id }));
    });
  }, [todaySchedule, reminderSwitch, scheduledIds, scheduleFor, cancelFor]);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerLocation}>
          {locationLoading
            ? "Detecting location..."
            : locationLabel || "Lokasi belum diketahui"}
        </Text>
        <Text style={styles.headerTime}>{formatTime(now)}</Text>
        <Text style={styles.headerSub}>
          {loading ? "Memuat jadwal…" : error || "Tetap konsisten dalam shalat"}
        </Text>
      </View>
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>
            {nextPrayerInfo ? nextPrayerInfo.label : "Waktu Shalat"}
          </Text>
          <Text style={styles.heroSub}>
            {nextPrayerInfo
              ? `Pukul ${nextPrayerInfo.time} • ${nextPrayerInfo.diff} lagi`
              : "Tidak ada jadwal berikutnya"}
          </Text>
        </View>
        <Ionicons name="time" size={28} color="#065F46" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dateCard}>
          <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
          <View>
            <Text style={styles.dateLabel}>Today</Text>
            <Text style={styles.dateValue}>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Waktu</Text>
            <Text style={styles.tableHeaderText}>Jam</Text>
            <Text style={styles.tableHeaderTextRight}>Pengingat</Text>
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
              <View style={styles.reminderSwitchBox}>
                <Switch
                  value={!!reminderSwitch[item.key]}
                  onValueChange={async (v) => {
                    setReminderSwitch((prev) => ({ ...prev, [item.key]: v }));
                    const time = item.time;
                    const label = item.label;
                    if (v) {
                      const existing = scheduledIds[item.key];
                      if (existing) await cancelFor(existing);
                      const id = await scheduleFor(item.key, label, time);
                      if (id) setScheduledIds((prev) => ({ ...prev, [item.key]: id }));
                    } else {
                      const existing = scheduledIds[item.key];
                      if (existing) {
                        await cancelFor(existing);
                        setScheduledIds((prev) => {
                          const p = { ...prev };
                          delete p[item.key];
                          return p;
                        });
                      }
                    }
                  }}
                  thumbColor={
                    reminderSwitch[item.key] ? PRIMARY_COLOR : "#FFFFFF"
                  }
                  trackColor={{ false: "#E5E7EB", true: "rgba(0,0,255,0.25)" }}
                />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <View style={styles.guideHeaderLeft}>
              <Ionicons name="book-outline" size={18} color="#065F46" />
              <Text style={styles.guideTitle}>Tatacara Sholat</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Tatacara")}
              style={styles.guideActionButton}
            >
              <Text style={styles.guideActionLabel}>Lihat</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.guideSub}>
            Panduan bacaan dan tatacara sholat dengan UI menarik
          </Text>
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
              <View
                style={[styles.tabCircle, isActive && styles.tabCircleActive]}
              >
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

export default Shalat;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F4F4F5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 12,
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
  heroCard: {
    marginHorizontal: 20,
    marginTop: 12,
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
  reminderSwitchBox: {
    flex: 1.2,
    alignItems: "flex-end",
    paddingRight: 6,
  },
  reminderText: {
    fontSize: 11,
    fontWeight: "500",
    color: PRIMARY_COLOR,
  },
  guideCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  guideHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  guideActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 255, 0.08)",
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  guideActionLabel: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  guideSub: {
    fontSize: 12,
    color: "#6B7280",
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
