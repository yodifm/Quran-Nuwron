import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Animated, { Layout, FadeInDown, FadeOutUp } from "react-native-reanimated";
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

const PRIMARY_COLOR = "#0000FF";
const API_URL = "https://islamic-api-zhirrr.vercel.app/api/bacaanshalat";

const Tatacara = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(API_URL);
        let data = Array.isArray(res.data) ? res.data : [];
        const hasIktidal = data.some((it) =>
          String(it?.name || "").toLowerCase().includes("iktidal") ||
          /i[’']?tidal/i.test(String(it?.name || "")),
        );
        if (!hasIktidal) {
          const iktidalItem = {
            name: "Iktidal",
            arabic: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ\nرَبَّنَا لَكَ الْحَمْدُ",
            latin: "Sami'allāhu liman ḥamidah\nRabbana laka al-ḥamdu",
            terjemahan:
              "Allah mendengar siapa yang memuji-Nya.\nWahai Rabb kami, bagi-Mu segala puji.",
          };
          const idx =
            data.findIndex((it) =>
              /rukuk|ruku'?/i.test(String(it?.name || "")),
            ) ?? -1;
          if (idx >= 0) {
            data.splice(idx + 1, 0, iktidalItem);
          } else {
            data.push(iktidalItem);
          }
        }
        setItems(data);
      } catch {
        setError("Gagal memuat tatacara sholat");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        <Text style={styles.headerTitle}>Tatacara Sholat</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Panduan Sholat</Text>
          <Text style={styles.heroSub}>
            Bacaan, transliterasi, dan terjemahan
          </Text>
        </View>
        <Ionicons name="book" size={28} color="#1E3A8A" />
      </View>

      {loading && (
        <View style={styles.statusRow}>
          <ActivityIndicator color={PRIMARY_COLOR} size="small" />
          <Text style={styles.statusText}>Memuat data…</Text>
        </View>
      )}
      {!loading && !!error && (
        <Text style={styles.statusTextError}>{error}</Text>
      )}

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.content}>
          {items.map((it, idx) => {
            const isOpen = !!expanded[idx];
            return (
              <View key={idx} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() =>
                    setExpanded((prev) => ({ ...prev, [idx]: !isOpen }))
                  }
                >
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons name="book-outline" size={18} color="#1E3A8A" />
                    <Text
                      style={styles.cardTitle}
                      onPress={() =>
                        setExpanded((prev) => ({ ...prev, [idx]: !isOpen }))
                      }
                    >
                      {it.name}
                    </Text>
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#1E3A8A"
                  />
                </TouchableOpacity>
                {isOpen && (
                  <Animated.View
                    layout={Layout.springify().duration(250)}
                    entering={FadeInDown.duration(200)}
                    exiting={FadeOutUp.duration(200)}
                    style={styles.cardBody}
                  >
                    {!!it.arabic && (
                      <View>
                        {it.arabic
                          .split(/﴿[٠-٩]+﴾/g)
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((line, i) => (
                            <View key={`a-${i}`} style={styles.listRow}>
                              <View style={styles.listNum}>
                                <Text style={styles.listNumText}>{i + 1}</Text>
                              </View>
                              <Text style={styles.listTextArab}>{line}</Text>
                            </View>
                          ))}
                      </View>
                    )}
                    {!!it.latin && (
                      <View style={{ marginTop: 8 }}>
                        {(it.latin
                          .split(/\s(?=\d+\.\s)/g)
                          .map((s) => s.trim())
                          .filter(Boolean).length > 1
                          ? it.latin
                              .split(/\s(?=\d+\.\s)/g)
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : it.latin
                              .split(/[\r\n]+/g)
                              .map((s) => s.trim())
                              .filter(Boolean)
                        ).map((line, i) => (
                          <View key={`l-${i}`} style={styles.listRow}>
                            <View style={styles.listNum}>
                              <Text style={styles.listNumText}>{i + 1}</Text>
                            </View>
                            <Text style={styles.listText}>
                              {line.replace(/^\d+\.\s*/, "")}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {!!it.terjemahan && (
                      <View style={{ marginTop: 8 }}>
                        {(it.terjemahan
                          .split(/\s(?=\d+\.\s)/g)
                          .map((s) => s.trim())
                          .filter(Boolean).length > 1
                          ? it.terjemahan
                              .split(/\s(?=\d+\.\s)/g)
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : it.terjemahan
                              .split(/[\r\n]+/g)
                              .map((s) => s.trim())
                              .filter(Boolean)
                        ).map((line, i) => (
                          <View key={`t-${i}`} style={styles.listRow}>
                            <View style={styles.listNum}>
                              <Text style={styles.listNumText}>{i + 1}</Text>
                            </View>
                            <Text style={styles.listText}>
                              {line.replace(/^\d+\.\s*/, "")}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Animated.View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Tatacara;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 12,
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
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6B7280",
  },
  statusTextError: {
    paddingHorizontal: 20,
    marginTop: 8,
    fontSize: 13,
    color: "#DC2626",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  cardBody: {
    marginTop: 8,
    gap: 8,
  },
  arabText: {
    fontSize: 20,
    color: "#1E3A8A",
    lineHeight: 30,
    textAlign: "right",
  },
  translitText: {
    fontSize: 14,
    color: "#374151",
  },
  translationText: {
    fontSize: 14,
    color: "#111827",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  listNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  listNumText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  listTextArab: {
    flex: 1,
    fontSize: 20,
    color: "#1E3A8A",
    lineHeight: 30,
    textAlign: "right",
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
});
