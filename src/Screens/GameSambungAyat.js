import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const GameSambungAyat = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);

  const current = questions[index] || null;

  const fetchSurahs = async () => {
    const res = await axios.get(QURAN_BASE_URL);
    const list = res.data?.data || [];
    return list;
  };

  const fetchSurahDetail = async (no) => {
    const url = `${QURAN_BASE_URL}/${no}`;
    const res = await axios.get(url);
    return res.data?.data || null;
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
      const shuffledSurahs = shuffle(surahs).slice(0, 20);

      const qs = [];
      for (let i = 0; i < shuffledSurahs.length && qs.length < 10; i++) {
        const s = shuffledSurahs[i];
        const detail = await fetchSurahDetail(s.nomor);
        const listAyat = Array.isArray(detail?.ayat) ? detail.ayat : [];
        if (listAyat.length < 2) continue;
        const idx = Math.floor(Math.random() * (listAyat.length - 1));
        const nowAyah = listAyat[idx];
        const nextAyah = listAyat[idx + 1];
        if (!nowAyah || !nextAyah) continue;

        const wrongs = [];
        const candidates = listAyat.filter(
          (a) =>
            a.nomorAyat !== nowAyah.nomorAyat &&
            a.nomorAyat !== nextAyah.nomorAyat,
        );
        shuffle(candidates)
          .slice(0, 2)
          .forEach((x) => wrongs.push(x));

        const options = shuffle([
          { text: nextAyah.teksArab, correct: true },
          ...wrongs.map((w) => ({ text: w.teksArab, correct: false })),
        ]);

        qs.push({
          surahLatin: detail.namaLatin,
          nomorSurah: detail.nomor,
          nowNumber: nowAyah.nomorAyat,
          nowArab: nowAyah.teksArab,
          nowTrans: nowAyah.teksIndonesia,
          correctArab: nextAyah.teksArab,
          options,
        });
      }
      setQuestions(qs);
    } catch {
      setError("Gagal menyiapkan soal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buildQuestions();
  }, [buildQuestions]);

  const choose = (opt, idxOpt) => {
    if (!current || selectedIdx !== null) return;
    setSelectedIdx(idxOpt);
    if (opt.correct) {
      setScore((s) => s + 1);
    }
  };

  const goNext = () => {
    setSelectedIdx(null);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setQuestions([]);
    setIndex(0);
    setScore(0);
    setSelectedIdx(null);
    buildQuestions();
  };

  const progressPct = useMemo(() => {
    if (!questions.length) return 0;
    return Math.min(100, ((index + 1) / questions.length) * 100);
  }, [index, questions.length]);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={18} color="#1F2937" />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sambung Ayat</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading && (
          <View style={styles.statusRow}>
            <ActivityIndicator color={PRIMARY_COLOR} size="small" />
            <Text style={styles.statusText}>Menyiapkan soal…</Text>
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
                      { width: `${progressPct}%` },
                    ]}
                  />
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardCaption}>
                Lanjutan dari {current.surahLatin} • Ayat {current.nowNumber}
              </Text>
              <Text style={styles.ayahArabic}>{current.nowArab}</Text>
              {!!current.nowTrans && (
                <Text style={styles.ayahTranslation}>{current.nowTrans}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardCaption}>
                Pilih ayat berikutnya yang benar
              </Text>
              <View style={{ gap: 8 }}>
                {current.options.map((opt, idx) => {
                  const chosen = selectedIdx === idx;
                  const showCorrect = selectedIdx !== null && opt.correct;
                  const showWrong = chosen && !opt.correct;
                  return (
                    <TouchableOpacity
                      key={`${current.nowNumber}-${idx}`}
                      style={[
                        styles.optionItem,
                        showCorrect && styles.optionCorrect,
                        showWrong && styles.optionWrong,
                      ]}
                      onPress={() => choose(opt, idx)}
                      disabled={selectedIdx !== null}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { textAlign: "right" },
                          showCorrect && { color: "#065F46" },
                          showWrong && { color: "#7F1D1D" },
                        ]}
                      >
                        {opt.text}
                      </Text>
                      {selectedIdx !== null && (
                        <Ionicons
                          name={
                            showCorrect
                              ? "checkmark-circle"
                              : chosen
                                ? "close-circle"
                                : "ellipse-outline"
                          }
                          size={20}
                          color={
                            showCorrect
                              ? "#10B981"
                              : chosen
                                ? "#EF4444"
                                : "#9CA3AF"
                          }
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedIdx !== null && (
                <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
                  <Text style={styles.nextText}>
                    {index >= questions.length - 1
                      ? "Lihat hasil"
                      : "Soal berikutnya"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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

export default GameSambungAyat;

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
  card: {
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
  cardCaption: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  ayahArabic: {
    fontSize: 20,
    color: "#111827",
    textAlign: "right",
  },
  ayahTranslation: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },
  optionItem: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    fontSize: 16,
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
});
