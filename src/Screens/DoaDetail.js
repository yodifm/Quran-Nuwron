import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    StatusBar,
} from "react-native";

const PRIMARY_COLOR = "#0000FF";

const DoaDetail = ({ navigation, route }) => {
  const { id } = route.params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`https://equran.id/api/doa/${id}`);
        const d = res.data?.data || res.data;
        setData(d);
      } catch {
        setError("Gagal memuat detail doa");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const title = data?.judul || data?.title || data?.nama || `Doa ${id}`;
  const shareContent = () => {
    const lines = [
      title,
      data?.grup ? `Grup: ${data.grup}` : null,
      data?.ar ? `\n${data.ar}` : null,
      data?.tr ? `\n${data.tr}` : null,
      data?.idn ? `\n${data.idn}` : null,
      data?.tentang ? `\nSumber: ${data.tentang}` : null,
    ].filter(Boolean);
    Share.share({ message: lines.join("\n") });
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>
        <View style={{ width: 20 }} />
        <TouchableOpacity onPress={shareContent} style={styles.backBtn}>
          <Ionicons name="share-social-outline" size={18} color="#111827" />
        </TouchableOpacity>
      </View>
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{title}</Text>
          {!!data?.grup && <Text style={styles.heroSub}>{data.grup}</Text>}
        </View>
        <Ionicons name="book" size={28} color="#065F46" />
      </View>

      {loading && (
        <View style={styles.statusRow}>
          <ActivityIndicator color={PRIMARY_COLOR} size="small" />
          <Text style={styles.statusText}>Memuat detail doa…</Text>
        </View>
      )}
      {!loading && !!error && (
        <Text style={styles.statusTextError}>{error}</Text>
      )}

      {!loading && !error && !!data && (
        <ScrollView contentContainerStyle={styles.content}>
          {!!data?.ar && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="sparkles-outline" size={16} color="#065F46" />
                  <Text style={styles.sectionTitle}>Teks Arab</Text>
                </View>
              </View>
              <Text style={styles.arabText}>{data.ar}</Text>
            </View>
          )}
          {!!data?.tr && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={16}
                    color="#065F46"
                  />
                  <Text style={styles.sectionTitle}>Transliterasi</Text>
                </View>
              </View>
              <Text style={styles.translitText}>{data.tr}</Text>
            </View>
          )}
          {!!data?.idn && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="language-outline" size={16} color="#065F46" />
                  <Text style={styles.sectionTitle}>Terjemahan</Text>
                </View>
              </View>
              <Text style={styles.translationText}>{data.idn}</Text>
            </View>
          )}
          {!!data?.tentang && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#065F46"
                  />
                  <Text style={styles.sectionTitle}>Tentang</Text>
                </View>
              </View>
              <View style={styles.aboutBox}>
                <Text style={styles.aboutText}>{data.tentang}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default DoaDetail;

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
  arabText: {
    fontSize: 22,
    color: "#065F46",
    lineHeight: 32,
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
  aboutBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  aboutText: {
    fontSize: 12,
    color: "#6B7280",
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
  sectionCard: {
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E3A8A",
  },
});
