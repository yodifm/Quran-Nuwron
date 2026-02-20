import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  Platform,
  StatusBar,
} from "react-native";

const PRIMARY_COLOR = "#0000FF";

const Doa = ({ navigation }) => {
  const [doas, setDoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoa = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("https://equran.id/api/doa");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setDoas(data);
      } catch {
        setError("Gagal memuat daftar doa");
      } finally {
        setLoading(false);
      }
    };
    fetchDoa();
  }, []);

  const renderItem = ({ item, index }) => {
    const title =
      item?.judul || item?.title || item?.nama || `Doa ${index + 1}`;
    const subtitle = item?.artinya || item?.terjemahan || item?.arti || "";
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (item?.id) {
            navigation.navigate("DoaDetail", { id: item.id });
          }
        }}
      >
        <Ionicons name="book-outline" size={20} color={PRIMARY_COLOR} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.cardSub}>{subtitle}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Semua Doa</Text>
        <View style={{ width: 20 }} />
      </View>
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Daily Prayer</Text>
          <Text style={styles.heroSub}>Kumpulan doa harian</Text>
        </View>
        <Ionicons name="book" size={28} color="#065F46" />
      </View>
      {loading && (
        <View style={styles.statusRow}>
          <ActivityIndicator color={PRIMARY_COLOR} size="small" />
          <Text style={styles.statusText}>Memuat doa…</Text>
        </View>
      )}
      {!loading && !!error && (
        <Text style={styles.statusTextError}>{error}</Text>
      )}
      {!loading && !error && (
        <FlatList
          data={doas}
          keyExtractor={(item, idx) => String(item?.id || idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

export default Doa;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 12,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  cardSub: {
    marginTop: 2,
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
});
