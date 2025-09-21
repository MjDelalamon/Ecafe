import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/landingPage");
    }, 2000); // 2 seconds splash screen
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/logo.jpg")} // put your logo in assets folder
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.text}>D’Esperanza Café</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff", // white bg
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6B4226", // coffee brown
  },
});
