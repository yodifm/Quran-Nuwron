import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const Detail = ({ navigation, route }) => {
  const [listAyat, setListAyat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentAyat, setCurrentAyat] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { namasurah, artisurah, jumlahsurah, jenissurah } = route.params;

  const getAyat = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(route.params.surahId);
      const data = response.data && response.data.data;
      if (data && Array.isArray(data.ayat)) {
        setListAyat(data.ayat);
      } else {
        setError("Gagal memuat ayat");
      }
    } catch (e) {
      setError("Gagal memuat ayat");
    } finally {
      setLoading(false);
    }
  };

  const playAyat = async (ayat) => {
    const url = ayat.audio && (ayat.audio["05"] || ayat.audio["01"] || null);
    if (!url) {
      return;
    }
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url });
      setSound(newSound);
      setCurrentAyat(ayat.nomorAyat);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          return;
        }
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentAyat(null);
        }
      });

      await newSound.playAsync();
    } catch (e) {}
  };

  const handlePressAyat = (ayat) => {
    if (currentAyat === ayat.nomorAyat && sound && isPlaying) {
      sound.pauseAsync();
      setIsPlaying(false);
      return;
    }
    playAyat(ayat);
  };

  useEffect(() => {
    getAyat();
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const renderHeader = () => (
    <View>
      <View style={styles.container}>
        <View style={styles.containerinside}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.prettyBack}
          >
            <Ionicons name="chevron-back" size={18} color="#1F2937" />
            <Text style={styles.prettyBackText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ backgroundColor: "#fff" }}>
        <View
          style={{
            backgroundColor: "#3C2A54",
            borderRadius: 12,
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={styles.move}>
            <Text
              style={{
                textAlign: "center",
                fontSize: 20,
                fontFamily: "Poppins-Light",
                color: "#FFF",
              }}
            >
              <Text>{namasurah}</Text>
            </Text>

            <View style={{ height: 10 }} />
            <Text
              style={{
                textAlign: "center",
                fontSize: 15,
                fontFamily: "Poppins-Light",
                color: "#FFF",
              }}
            >
              <Text>{artisurah}</Text>
            </Text>
            <View style={{ height: 7 }} />
            <View style={styles.lineStyle} />
            <View style={{ height: 7 }} />
            <Text
              style={{
                textAlign: "center",
                fontSize: 15,
                fontFamily: "Poppins-Light",
                color: "#FFF",
              }}
            >
              <Text>
                Surah {jenissurah} - {jumlahsurah} Ayat
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {loading && <Text style={styles.statusText}>Memuat ayat…</Text>}

      {!loading && !!error && (
        <Text style={styles.statusTextError}>{error}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={!loading && !error ? listAyat : []}
        keyExtractor={(item) => String(item.nomorAyat)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.ayahCard}>
            <View style={styles.ayahHeaderRow}>
              <View style={styles.ayahNumberCircle}>
                <Text style={styles.ayahNumberText}>{item.nomorAyat}</Text>
              </View>
              <View style={styles.ayahHeaderIcons}>
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color="#3C2A54"
                />
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color="#3C2A54"
                  style={{ marginLeft: 12 }}
                />
                <TouchableOpacity
                  onPress={() => handlePressAyat(item)}
                  style={{ marginLeft: 12 }}
                >
                  <Ionicons
                    name={
                      currentAyat === item.nomorAyat && isPlaying
                        ? "pause-circle"
                        : "play-circle"
                    }
                    size={22}
                    color="#3C2A54"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.ayahArabic}>{item.teksArab}</Text>
            <Text style={styles.ayahTranslation}>{item.teksIndonesia}</Text>
          </View>
        )}
        ListHeaderComponent={renderHeader}
      />
    </SafeAreaView>
  );
};

export default Detail;

const styles = StyleSheet.create({
  wrapperSurah: {
    flex: 1,
    padding: 8,
    backgroundColor: "white",
  },
  wrapperAyat: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 8,
  },
  wrapperNumber: {
    color: "#3C2A54",
  },
  wrappertextArabic: {
    fontSize: 20,
    color: "#3C2A54",
  },
  wrappertranslation: {
    padding: 8,
    color: "#3C2A54",
    justifyContent: "center",
    marginVertical: 8,
    backgroundColor: "#F8F5FD",
    borderRadius: 8,
  },
  container: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  containerinside: {
    flexDirection: "row",
  },
  prettyBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  prettyBackText: {
    fontSize: 13,
    color: "#1F2937",
    fontFamily: "Poppins-Medium",
  },
  move: { padding: 35, marginRight: 8, marginLeft: 5 },
  lineStyle: {
    borderWidth: 0.5,
    borderColor: "white",
    margin: 3,
  },
  statusText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  statusTextError: {
    marginTop: 12,
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
  },
  ayahCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ayahHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ayahNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F4ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  ayahNumberText: {
    fontSize: 14,
    color: "#3C2A54",
    fontWeight: "600",
  },
  ayahHeaderIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  ayahArabic: {
    fontSize: 20,
    color: "#3C2A54",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 4,
  },
  ayahTranslation: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
  },
});
