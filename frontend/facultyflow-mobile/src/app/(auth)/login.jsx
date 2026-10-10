import {
    useState
} from "react";

import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet
} from "react-native";

import {
    router
} from "expo-router";

import {
    colors
} from "../../constants/colors";

import {
    useAuth
} from "../../context/AuthContext";


function LoginScreen() {

    const {
        login
    } = useAuth();


    const [
        email,
        setEmail
    ] = useState("");


    const [
        password,
        setPassword
    ] = useState("");


    const [
        error,
        setError
    ] = useState("");


    const [
        loading,
        setLoading
    ] = useState(false);


    // ========================================================
    // LOGIN
    // ========================================================

    async function handleLogin() {

        setError("");


        if (
            !email.trim() ||
            !password
        ) {

            setError(
                "Please enter your email and password."
            );

            return;

        }


        setLoading(true);


        try {

            const result =
                await login(
                    email.trim(),
                    password
                );


            if (!result.success) {

                setError(
                    result.message ||
                    "Login failed."
                );

                return;

            }


            router.replace(
                "/(app)/home"
            );

        } catch (error) {

            console.error(
                "Login screen error:",
                error
            );


            setError(
                error?.message ||
                "Unable to login."
            );

        } finally {

            setLoading(false);

        }

    }


    return (

        <View style={styles.container}>

            <View style={styles.brand}>

                <View style={styles.logo}>

                    <Text style={styles.logoText}>
                        F
                    </Text>

                </View>


                <Text style={styles.brandName}>
                    FacultyFlow
                </Text>


                <Text style={styles.brandSubtitle}>
                    Attendance Management System
                </Text>

            </View>


            <View style={styles.card}>

                <Text style={styles.title}>
                    Welcome back
                </Text>


                <Text style={styles.description}>
                    Sign in to access your FacultyFlow workspace.
                </Text>


                {error ? (

                    <View style={styles.errorBox}>

                        <Text style={styles.errorText}>
                            {error}
                        </Text>

                    </View>

                ) : null}


                <Text style={styles.label}>
                    Email address
                </Text>


                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={
                        colors.textMuted
                    }
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!loading}
                />


                <Text style={styles.label}>
                    Password
                </Text>


                <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={
                        colors.textMuted
                    }
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                />


                <Pressable
                    style={({ pressed }) => [

                        styles.button,

                        pressed &&
                            styles.buttonPressed

                    ]}
                    onPress={handleLogin}
                    disabled={loading}
                >

                    <Text style={styles.buttonText}>

                        {loading
                            ? "Signing in..."
                            : "Sign In"
                        }

                    </Text>

                </Pressable>

            </View>

        </View>

    );

}


const styles = StyleSheet.create({

    container: {

        flex: 1,

        padding: 22,

        justifyContent: "center",

        backgroundColor:
            colors.background

    },


    brand: {

        alignItems: "center",

        marginBottom: 26

    },


    logo: {

        width: 58,

        height: 58,

        borderRadius: 17,

        alignItems: "center",

        justifyContent: "center",

        backgroundColor:
            colors.primary

    },


    logoText: {

        color: colors.white,

        fontSize: 27,

        fontWeight: "800"

    },


    brandName: {

        marginTop: 12,

        color: colors.text,

        fontSize: 28,

        fontWeight: "800"

    },


    brandSubtitle: {

        marginTop: 4,

        color: colors.textSecondary,

        fontSize: 13

    },


    card: {

        padding: 22,

        borderRadius: 20,

        backgroundColor:
            colors.surface,

        borderWidth: 1,

        borderColor:
            colors.border

    },


    title: {

        color: colors.text,

        fontSize: 22,

        fontWeight: "800"

    },


    description: {

        marginTop: 6,

        marginBottom: 22,

        color: colors.textSecondary,

        lineHeight: 20,

        fontSize: 13

    },


    errorBox: {

        marginBottom: 16,

        padding: 12,

        borderRadius: 10,

        backgroundColor:
            colors.dangerSoft

    },


    errorText: {

        color: colors.danger,

        fontSize: 12,

        fontWeight: "600"

    },


    label: {

        marginBottom: 7,

        color: colors.text,

        fontSize: 12,

        fontWeight: "700"

    },


    input: {

        height: 50,

        marginBottom: 17,

        paddingHorizontal: 14,

        borderWidth: 1,

        borderColor:
            colors.border,

        borderRadius: 10,

        color: colors.text,

        backgroundColor:
            colors.white

    },


    button: {

        height: 52,

        alignItems: "center",

        justifyContent: "center",

        borderRadius: 11,

        backgroundColor:
            colors.primary

    },


    buttonPressed: {

        backgroundColor:
            colors.primaryDark

    },


    buttonText: {

        color: colors.white,

        fontSize: 14,

        fontWeight: "800"

    }

});


export default LoginScreen;