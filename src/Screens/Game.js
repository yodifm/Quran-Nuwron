import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import {
    BackHandler,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY_COLOR = "#3B82F6";

const Game = ({ navigation }) => {
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

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Game Islami</Text>
            <Text style={styles.heroSub}>Pusat permainan EQuran</Text>
          </View>
          <Ionicons name="game-controller" size={32} color={PRIMARY_COLOR} />
        </View>
        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.gameCard}
            onPress={() => navigation.navigate("GameTebakAyat")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Ionicons name="musical-notes" size={22} color={PRIMARY_COLOR} />
              <Text style={styles.cardTitle}>Tebak Ayat</Text>
            </View>
            <Text style={styles.cardText}>
              Dengarkan audio ayat dan tebak surat + nomor ayatnya.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gameCard} disabled>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Ionicons name="link" size={22} color="#9CA3AF" />
              <Text style={styles.cardTitle}>Sambung Ayat (segera)</Text>
            </View>
            <Text style={styles.cardText}>
              Pilih ayat selanjutnya yang benar dari pilihan yang ada.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomBar}>
        {[
          { label: "Home", icon: "home", route: "Home" },
          { label: "Shalat", icon: "time", route: "Shalat" },
          { label: "Quran", icon: "book", route: "Quran" },
          { label: "Qiblat", icon: "compass", route: "Qiblat" },
          { label: "Game", icon: "game-controller", route: "Game" },
        ].map((item) => {
          const isActive = item.label === "Game";
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

export default Game;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 90,
  },
  heroCard: {
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
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  heroSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#3B82F6",
  },
  cards: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cardText: {
    marginTop: 6,
    fontSize: 13,
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
  bottomLabel: {
    fontSize: 11,
    marginTop: 2,
    color: "#9CA3AF",
  },
  bottomLabelActive: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
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
});
