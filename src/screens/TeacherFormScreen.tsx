import { useAuth } from "@/context/auth-context";
import {
  createUser,
  getUserById,
  updateUser,
  type UpdateUserInput,
} from "@/services/users/users-api";
import { showMessage } from "@/utils/dialogs";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface TeacherFormScreenProps {
  // Sem id = cadastro; com id = edição.
  id?: string;
}

export default function TeacherFormScreen({ id }: TeacherFormScreenProps) {
  const { session } = useAuth();
  const isEditing = Boolean(id);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Na edição, carrega os dados atuais do professor.
  useEffect(() => {
    if (!id) return;
    let active = true;

    getUserById(id, session)
      .then((teacher) => {
        if (!active) return;
        if (teacher.role !== "TEACHER") {
          setLoadError("Este usuário não é um professor.");
          return;
        }
        setName(teacher.name);
        setEmail(teacher.email);
      })
      .catch((err) => {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Erro ao carregar professor.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, session]);

  // Mesmas regras do back-end, para avisar antes de enviar.
  function validate(): string | null {
    if (name.trim().length < 3) {
      return "O nome precisa ter pelo menos 3 caracteres.";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "Informe um e-mail válido.";
    }
    if (!isEditing && password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }
    if (isEditing && password.length > 0 && password.length < 6) {
      return "A nova senha precisa ter pelo menos 6 caracteres.";
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (isEditing && id) {
        const input: UpdateUserInput = {
          name: name.trim(),
          email: normalizedEmail,
        };
        // Só envia a senha se o professor digitou uma nova.
        if (password) input.password = password;
        await updateUser(id, input, session);
        showMessage("Pronto", "Professor atualizado com sucesso.");
      } else {
        await createUser(
          {
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: "TEACHER",
          },
          session,
        );
        showMessage("Pronto", "Professor cadastrado com sucesso.");
      }
      router.back();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Não foi possível salvar.",
      );
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backButtonArrow}>←</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>PROFESSORES</Text>
          <Text style={styles.title}>
            {isEditing ? "Editar professor" : "Novo professor"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2F68F5" />
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.linkText}>Voltar para a lista</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nome completo"
              placeholderTextColor="#94A3B8"
              autoCapitalize="words"
              style={styles.input}
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="professor@escola.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="off"
              style={styles.input}
            />

            <Text style={styles.label}>
              {isEditing ? "Nova senha (opcional)" : "Senha"}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={
                isEditing
                  ? "Deixe em branco para manter a atual"
                  : "Mínimo de 6 caracteres"
              }
              placeholderTextColor="#94A3B8"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              style={styles.input}
            />

            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                submitting && styles.submitButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? "Salvar alterações" : "Cadastrar professor"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FF" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2EBF6",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButtonArrow: { fontSize: 16, color: "#2F68F5", fontWeight: "600" },
  pressed: { opacity: 0.75 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#2F68F5",
    marginBottom: 2,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: { color: "#DC2626", textAlign: "center", marginBottom: 12 },
  linkText: { color: "#2F68F5", fontWeight: "700" },
  form: { padding: 16, paddingBottom: 40 },
  label: {
    marginBottom: 7,
    marginTop: 16,
    color: "#17233B",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#D8E4F2",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    color: "#17233B",
  },
  formError: { marginTop: 16, color: "#DC2626", fontSize: 13 },
  submitButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: "#2F68F5",
  },
  submitButtonPressed: {
    backgroundColor: "#2056D6",
    transform: [{ scale: 0.985 }],
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});