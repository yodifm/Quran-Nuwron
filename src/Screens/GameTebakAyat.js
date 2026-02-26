import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Audio } from "expo-av";
import { useCallback, useEffect, useState } from "react";
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
const QURAN_BASE_URL = "https://equran.id/api/v2/surat";

const GameTebakAyat = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedKey, setSelectedKey] = useState(null);
  const [sound, setSound] = useState(null);

  const current = questions[index] || null;

  const stopAudio = useCallback(async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
    } catch {}
  }, [sound]);

  const playAudio = async (url) => {
    try {
      await stopAudio();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url });
      setSound(newSound);
      await newSound.playAsync();
    } catch {}
  };

  const stopPlayback = async () => {
    await stopAudio();
  };

  const fetchSurahs = async () => {
    const res = await axios.get(QURAN_BASE_URL);
    const list = res.data?.data || [];
    return list;
  };

  const fetchSurahDetail = async (id) => {
    const url = `${QURAN_BASE_URL}/${id}`;
    const res = await axios.get(url);
    return res.data?.data || null;
  };

  const pickAyatWithAudio = (surah) => {
    const arr = Array.isArray(surah?.ayat) ? surah.ayat : [];
    const candidates = arr.filter(
      (a) => a?.audio && (a.audio["05"] || a.audio["01"]),
    );
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const buildQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const surahs = await fetchSurahs();
      if (!Array.isArray(surahs) || surahs.length === 0) {
        setError("Gagal memuat daftar surat");
        setLoading(false);
        return;
      }
      const shuffled = [...surahs].sort(() => Math.random() - 0.5);
      const base = shuffled.slice(0, 12);

      const qs = [];
      for (let i = 0; i < base.length && qs.length < 10; i++) {
        const s = base[i];
        const detail = await fetchSurahDetail(s.nomor);
        if (!detail) continue;
        const ayat = pickAyatWithAudio(detail);
        if (!ayat) continue;
        const audioUrl = ayat.audio["05"] || ayat.audio["01"] || null;
        if (!audioUrl) continue;

        const correctKey = `${detail.namaLatin} • ${ayat.nomorAyat}`;

        const distractorsPool = surahs.filter((x) => x.nomor !== s.nomor);
        const options = [
          {
            key: correctKey,
            arabic: detail.nama,
            latin: `${detail.namaLatin} • ${ayat.nomorAyat}`,
          },
        ];
        while (options.length < 4 && distractorsPool.length > 0) {
          const idx = Math.floor(
            Math.random() * Math.min(40, distractorsPool.length),
          );
          const d = distractorsPool.splice(idx, 1)[0];
          const ayNo = Math.max(
            1,
            Math.min(d.jumlahAyat || 7, Math.floor(Math.random() * 7) + 1),
          );
          options.push({
            key: `${d.namaLatin} • ${ayNo}`,
            arabic: d.nama,
            latin: `${d.namaLatin} • ${ayNo}`,
          });
        }
        const shuffledOptions = options.sort(() => Math.random() - 0.5);

        qs.push({
          audio: audioUrl,
          surahName: detail.namaLatin,
          ayatNumber: ayat.nomorAyat,
          correctKey,
          arabicAyah: ayat.teksArab,
          translationAyah: ayat.teksIndonesia,
          options: shuffledOptions,
        });
      }

      setQuestions(qs);
    } catch {
      setError("Gagal menyiapkan pertanyaan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buildQuestions();
  }, [buildQuestions]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const selectOption = async (optKey) => {
    if (!current || selectedKey) return;
    setSelectedKey(optKey);
    if (optKey === current.correctKey) {
      setScore((s) => s + 1);
    }
    await stopAudio();
  };

  const goNext = async () => {
    if (!questions.length) return;
    await stopAudio();
    setSelectedKey(null);
    setIndex((i) => i + 1);
  };

  const restart = async () => {
    await stopAudio();
    setQuestions([]);
    setIndex(0);
    setScore(0);
    setSelectedKey(null);
    buildQuestions();
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color="#1F2937" />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tebak Ayat</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading && (
          <View style={styles.statusRow}>
            <ActivityIndicator color={PRIMARY_COLOR} size="small" />
            <Text style={styles.statusText}>Menyiapkan pertanyaan…</Text>
          </View>
        )}

        {!loading && !!error && (
          <Text style={styles.statusTextError}>{error}</Text>
        )}

        {!loading && !error && current && (
          <View>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                Soal {index + 1}/{questions.length || 10} • Skor {score}
              </Text>
              {questions.length > 0 && (
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${((index + 1) / questions.length) * 100}%`,
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            {!!current.arabicAyah && (
              <View style={styles.audioCard}>
                <Text style={styles.ayahArabic}>{current.arabicAyah}</Text>
                {!!current.translationAyah && (
                  <Text style={styles.ayahTranslation}>
                    {current.translationAyah}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.audioCard}>
              <Text style={styles.audioLabel}>
                Dengarkan audio ayat, lalu pilih surat dan nomor ayatnya
              </Text>
              <View style={styles.audioControls}>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => playAudio(current.audio)}
                >
                  <Ionicons name="play" size={18} color="#FFFFFF" />
                  <Text style={styles.playText}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.playBtn, { backgroundColor: "#6B7280" }]}
                  onPress={stopPlayback}
                >
                  <Ionicons name="stop" size={18} color="#FFFFFF" />
                  <Text style={styles.playText}>Stop</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsList}>
              {current.options.map((opt) => {
                const isCorrect = selectedKey && opt.key === current.correctKey;
                const isWrong =
                  selectedKey &&
                  selectedKey === opt.key &&
                  opt.key !== current.correctKey;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.optionItem,
                      isCorrect && styles.optionCorrect,
                      isWrong && styles.optionWrong,
                    ]}
                    onPress={() => selectOption(opt.key)}
                    disabled={!!selectedKey}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View style={{ flex: 1 }}>
                        {!!opt.arabic && (
                          <Text
                            style={{
                              fontSize: 16,
                              textAlign: "right",
                              color: "#111827",
                              marginBottom: 4,
                            }}
                          >
                            {opt.arabic}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            isCorrect && { color: "#065F46" },
                            isWrong && { color: "#7F1D1D" },
                          ]}
                        >
                          {opt.latin}
                        </Text>
                      </View>
                      {!!selectedKey && (
                        <Ionicons
                          name={isCorrect ? "checkmark-circle" : "close-circle"}
                          size={22}
                          color={isCorrect ? "#10B981" : "#EF4444"}
                          style={{ marginLeft: 10 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!selectedKey && (
              <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
                <Text style={styles.nextText}>
                  {index >= questions.length - 1
                    ? "Lihat hasil"
                    : "Soal berikutnya"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading && !error && !current && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Selesai</Text>
            <Text style={styles.resultText}>Skor kamu: {score} / 10</Text>
            <TouchableOpacity style={styles.restartBtn} onPress={restart}>
              <Text style={styles.restartText}>Main Lagi</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default GameTebakAyat;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backText: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusTextError: {
    fontSize: 13,
    color: "#DC2626",
  },
  progressRow: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: "#6B7280",
  },
  progressBarBackground: {
    marginTop: 6,
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 999,
  },
  audioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  audioLabel: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 10,
  },
  audioControls: {
    flexDirection: "row",
    gap: 8,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  playText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  optionText: {
    fontSize: 14,
    color: "#111827",
  },
  optionCorrect: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
    borderWidth: 1,
  },
  optionWrong: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
    borderWidth: 1,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  resultText: {
    fontSize: 14,
    color: "#374151",
  },
  restartBtn: {
    marginTop: 8,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  restartText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  nextBtn: {
    marginTop: 16,
    alignSelf: "flex-end",
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  ayahArabic: {
    fontSize: 20,
    color: "#111827",
    textAlign: "right",
    marginBottom: 8,
  },
  ayahTranslation: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },
});
