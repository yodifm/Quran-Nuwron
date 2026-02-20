import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const Splash = ({ navigation }) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        backgroundColor: "white",
      }}
    >
      <View>
        <Text style={styles.Title}>قرآن النور</Text>
        <Text style={styles.subTitle}>
          Read the Quran, It will show you how the simple life can be
        </Text>
      </View>
      <Image
        source={require("../Screens/read_quran1.png")}
        style={{ width: 300, height: 300 }}
      />
      <Pressable
        style={styles.button}
        onPress={() => navigation.replace("Home")}
      >
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>
      {/* <Text style={{fontSize:32, color:'#000', fontFamily:'Poppins-Light'}}>Hello Yodi</Text> */}
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  Title: {
    alignItems: "center",
    justifyContent: "center",
    color: "blue",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 28,
    paddingBottom: 18,
  },
  subTitle: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    paddingHorizontal: 50,
    color: "#6B6B7F",
    fontSize: 18,
    paddingBottom: 27,
  },
  button: {
    marginTop: 16,
    backgroundColor: "blue",
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

{
  /* <View style={styles.container}>
        <View>
          <Text style={styles.title}>Assalamualaikum</Text>
          <Text style={styles.SubTitle}>Yuk sama sama kita baca Al-Quran</Text>
        </View>
      </View>
        <View>
          <Image
            source={require('../Screens/Group1.png')}
            style={{width: 340, height: 130, alignItems:'center', alignSelf:'center'}}
          />
        </View> */
}

// title: {fontSize: 22, fontFamily: 'Poppins-Medium', color: '#', fontWeight:'bold'},
// SubTitle: {fontSize: 14, fontFamily: 'Poppins-Light', color: '#C7C9D9'},
// back: {padding: 16, marginRight: 16, marginLeft: -10},
