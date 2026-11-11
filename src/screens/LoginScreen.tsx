import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TextInput as TextInputRef } from "react-native";
import { useAuth } from "@/context/auth-context";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function GraduationCapIcon() {
  return (
    <View style={styles.graduationIcon}>
      <View style={styles.capDiamond} />
      <View style={styles.capBase} />
      <View style={styles.capTassel} />
    </View>
  );
}

function EmailIcon({ focused }: { focused?: boolean }) {
  return (
    <Text style={[styles.emailIcon, focused && styles.iconFocused]}>✉</Text>
  );
}

function PasswordIcon({ focused }: { focused?: boolean }) {
  const iconColor = focused ? "#2872F0" : "#607897";
  return (
    <View accessible={false} style={styles.lockIcon}>
      <View style={[styles.lockShackle, { borderColor: iconColor }]} />
      <View style={[styles.lockBody, { borderColor: iconColor }]} />
    </View>
  );
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <View
      accessibilityLabel={visible ? "Senha visível" : "Senha oculta"}
      style={styles.eyeIcon}
    >
      <View style={styles.eyePupil} />
    </View>
  );
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<TextInputRef>(null);
  const passwordInputRef = useRef<TextInputRef>(null);

  async function handleSignIn() {
    const normalizedEmail = email.trim();

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    if (!password) {
      setErrorMessage("Informe sua senha.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn(normalizedEmail, password);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.brand}>
            <GraduationCapIcon />
            <Text style={styles.title}>Portal Escolar</Text>
            <Text style={styles.subtitle}>O blog oficial da nossa escola</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <Pressable
              accessibilityRole="none"
              onPress={() => emailInputRef.current?.focus()}
              style={[
                styles.inputContainer,
                isEmailFocused && styles.inputContainerFocused,
              ]}
            >
              <View pointerEvents="none">
                <EmailIcon focused={isEmailFocused} />
              </View>
              <TextInput
                accessibilityLabel="E-mail"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isSubmitting}
                keyboardType="email-address"
                onBlur={() => setIsEmailFocused(false)}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                placeholder="aluno@escola.edu.br"
                placeholderTextColor="#8FA5C3"
                ref={emailInputRef}
                returnKeyType="next"
                style={styles.input}
                textContentType="emailAddress"
                underlineColorAndroid="transparent"
                value={email}
              />
            </Pressable>

            <Text style={styles.label}>Senha</Text>
            <Pressable
              accessibilityRole="none"
              onPress={() => passwordInputRef.current?.focus()}
              style={[
                styles.inputContainer,
                isPasswordFocused && styles.inputContainerFocused,
              ]}
            >
              <View pointerEvents="none">
                <PasswordIcon focused={isPasswordFocused} />
              </View>
              <TextInput
                accessibilityLabel="Senha"
                autoCapitalize="none"
                autoComplete="password"
                editable={!isSubmitting}
                onBlur={() => setIsPasswordFocused(false)}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onSubmitEditing={handleSignIn}
                placeholder="Digite sua senha"
                placeholderTextColor="#8FA5C3"
                ref={passwordInputRef}
                returnKeyType="go"
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                textContentType="password"
                underlineColorAndroid="transparent"
                value={password}
              />
              <Pressable
                accessibilityLabel={
                  isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
                }
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setIsPasswordVisible((visible) => !visible)}
                style={styles.visibilityButton}
              >
                <PasswordVisibilityIcon visible={isPasswordVisible} />
              </Pressable>
            </Pressable>

            {errorMessage ? (
              <Text accessibilityRole="alert" style={styles.errorMessage}>
                {errorMessage}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSignIn}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !isSubmitting && styles.submitButtonPressed,
                isSubmitting && styles.submitButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Entrar</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>◈</Text>
          <Text style={styles.securityText}>
            Espaço seguro e moderado para estudantes
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: "#EAF4FF",
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  card: {
    padding: 26,
    borderWidth: 2,
    borderColor: "#58AFFF",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    shadowColor: "#2F68F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  graduationIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: "#EEF6FF",
  },
  capDiamond: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: "#2872F0",
    transform: [{ rotate: "45deg" }],
  },
  capBase: {
    position: "absolute",
    bottom: 13,
    width: 20,
    height: 7,
    borderBottomWidth: 1.5,
    borderColor: "#2872F0",
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
  },
  capTassel: {
    position: "absolute",
    right: 12,
    top: 22,
    width: 1,
    height: 7,
    backgroundColor: "#2872F0",
  },
  title: {
    color: "#17233B",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    color: "#62748E",
    fontSize: 13,
  },
  form: {
    width: "100%",
  },
  label: {
    marginBottom: 7,
    color: "#17233B",
    fontSize: 13,
    fontWeight: "600",
  },
  inputContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#D8E4F2",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  inputContainerFocused: {
    borderColor: "#2872F0",
    backgroundColor: "#FAFCFF",
    shadowColor: "#2872F0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  emailIcon: {
    width: 22,
    color: "#607897",
    fontSize: 18,
    textAlign: "center",
  },
  iconFocused: {
    color: "#2872F0",
  },
  lockIcon: {
    width: 22,
    height: 20,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  lockShackle: {
    position: "absolute",
    top: 1,
    width: 9,
    height: 10,
    borderWidth: 1.5,
    borderColor: "#607897",
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  lockBody: {
    width: 13,
    height: 10,
    borderWidth: 1.5,
    borderColor: "#607897",
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    height: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 10,
    color: "#17233B",
    fontSize: 14,
    ...Platform.select({
      web: {
        outlineStyle: "none" as never,
      },
      android: {
        paddingVertical: 0,
      },
    }),
  },
  visibilityButton: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: {
    width: 16,
    height: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.4,
    borderColor: "#607897",
    borderRadius: 8,
  },
  eyePupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#607897",
  },
  errorMessage: {
    marginTop: -4,
    marginBottom: 14,
    color: "#B42318",
    fontSize: 13,
    lineHeight: 19,
  },
  submitButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: "#2F68F5",
  },
  submitButtonPressed: {
    backgroundColor: "#2056D6",
    transform: [{ scale: 0.985 }],
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  securityIcon: {
    marginRight: 8,
    color: "#597393",
    fontSize: 15,
  },
  securityText: {
    color: "#597393",
    fontSize: 12,
  },
});
