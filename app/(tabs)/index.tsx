import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>Quran Abi</Text>
        <Text style={styles.subTitle}>
          Read the Quran, It will show you how the simple life can be
        </Text>
      </View>
      <Image
        source={require("@/src/Screens/read_quran1.png")}
        style={styles.image}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  title: {
    color: "blue",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 12,
  },
  subTitle: {
    textAlign: "center",
    color: "#6B6B7F",
    fontSize: 18,
  },
  image: {
    width: 300,
    height: 300,
  },
});
