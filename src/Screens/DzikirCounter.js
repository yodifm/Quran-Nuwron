import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
    BackHandler,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
const PRIMARY_COLOR = "#0000FF";

const DzikirCounter = ({ navigation }) => {
  const options = useMemo(
    () => [
      { key: "astaghfirullah", label: "Astaghfirullah" },
      { key: "subhanallah", label: "Subhanallah" },
      { key: "alhamdulillah", label: "Alhamdulillah" },
      { key: "allahuakbar", label: "Allahu Akbar" },
    ],
    [],
  );
  const arabicMap = useMemo(
    () => ({
      astaghfirullah: "أستغفر الله",
      subhanallah: "سبحان الله",
      alhamdulillah: "الحمد لله",
      allahuakbar: "الله أكبر",
    }),
    [],
  );
  const [selected, setSelected] = useState(options[0].key);
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [navigation]),
  );

  const label = useMemo(
    () => options.find((o) => o.key === selected)?.label || "",
    [options, selected],
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dzikir Counter</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.grid}>
          {options.map((opt) => {
            const active = opt.key === selected;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.gridItem, active && styles.gridItemActive]}
                onPress={() => {
                  setSelected(opt.key);
                  setCount(0);
                }}
              >
                <Text style={[styles.arabicText, active && styles.arabicTextActive]}>
                  {arabicMap[opt.key]}
                </Text>
                <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.counterSection}>
          <Text style={styles.counterArabic}>{arabicMap[selected]}</Text>
          <Text style={styles.counterHeading}>{label}</Text>
          <Text style={styles.counterValue}>{String(count).padStart(3, "0")}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setCount(0)}
              hitSlop={10}
            >
              <Ionicons name="refresh" size={18} color={PRIMARY_COLOR} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusFullBtn}
              onPress={() => setCount((c) => c + 1)}
            >
              <Text style={styles.plusFullText}>Tambah Hitungan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DzikirCounter;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F4F4F5",
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  gridItem: {
    width: "47%",
    backgroundColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
  },
  gridItemActive: {
    backgroundColor: "rgba(0,0,255,0.18)",
  },
  arabicText: {
    fontSize: 26,
    color: "#111827",
  },
  arabicTextActive: {
    color: PRIMARY_COLOR,
  },
  itemLabel: {
    fontSize: 16,
    color: "#111827",
  },
  itemLabelActive: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  counterSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 10,
  },
  counterArabic: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  counterHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: "800",
    color: PRIMARY_COLOR,
    letterSpacing: 2,
    marginTop: 12,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    alignSelf: "stretch",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,255,0.08)",
    borderColor: "rgba(0,0,255,0.18)",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  resetText: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  plusFullBtn: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 999,
  },
  plusFullText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
})
