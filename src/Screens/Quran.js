import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY_COLOR = "#0000FF";
const QURAN_BASE_URL = "https://equran.id/api/v2/surat";

const Quran = ({ navigation }) => {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    const fetchSurahs = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(QURAN_BASE_URL);
        const data = response.data?.data;
        if (Array.isArray(data)) {
          setSurahs(data);
        } else {
          setSurahs([]);
          setError("Gagal memuat daftar surat");
        }
      } catch {
        setError("Gagal memuat daftar surat");
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  const renderSurahItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.surahItem}
        onPress={() =>
          navigation.navigate("Detail", {
            namasurah: item.namaLatin,
            artisurah: item.arti,
            jumlahsurah: item.jumlahAyat,
            jenissurah: item.tempatTurun,
            surahId: `https://equran.id/api/v2/surat/${item.nomor}`,
            audioFull: item.audioFull,
            nomor: item.nomor,
          })
        }
      >
        <View style={styles.surahLeft}>
          <View style={styles.surahNumberCircle}>
            <Text style={styles.surahNumberText}>{item.nomor}</Text>
          </View>
          <View style={styles.surahInfo}>
            <Text style={styles.surahNameLatin}>{item.namaLatin}</Text>
            <Text style={styles.surahMeta}>
              {item.tempatTurun} • {item.jumlahAyat} Ayat
            </Text>
          </View>
        </View>
        <Text style={styles.surahArabicName}>{item.nama}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.textWrapper}>
            <Text style={styles.title}>Quran Abi</Text>
            <Text style={styles.subTitle}>
              Read the Quran, It will show you how the simple life can be
            </Text>
          </View>
          <Image
            source={require("../Screens/read_quran1.png")}
            style={styles.image}
          />
        </View>

        {loading && (
          <View style={styles.statusWrapper}>
            <ActivityIndicator color={PRIMARY_COLOR} size="small" />
            <Text style={styles.statusText}>Memuat daftar surat…</Text>
          </View>
        )}

        {!loading && !!error && (
          <Text style={styles.statusTextError}>{error}</Text>
        )}

        {!loading && !error && (
          <FlatList
            data={surahs}
            keyExtractor={(item) => String(item.nomor)}
            renderItem={renderSurahItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.bottomBar}>
        {[
          { label: "Home", icon: "home", route: "Home" },
          { label: "Shalat", icon: "time", route: "Shalat" },
          { label: "Qiblat", icon: "compass", route: "Qiblat" },
          { label: "Quran", icon: "book", route: "Quran" },
        ].map((item) => {
          const isActive = item.label === "Quran";
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

export default Quran;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 90,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 255, 0.06)",
    marginBottom: 16,
  },
  textWrapper: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: PRIMARY_COLOR,
    fontWeight: "700",
    fontSize: 22,
    marginBottom: 6,
  },
  subTitle: {
    color: "#6B6B7F",
    fontSize: 13,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  statusWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6B7280",
  },
  statusTextError: {
    marginTop: 12,
    fontSize: 13,
    color: "#DC2626",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  surahItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  surahLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  surahNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  surahNumberText: {
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  surahInfo: {
    flex: 1,
  },
  surahNameLatin: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  surahMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },
  surahArabicName: {
    fontSize: 18,
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
