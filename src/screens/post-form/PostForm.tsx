import { useState } from "react";
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
import { SUBJECT_MAP } from "@/services/posts/posts-api";

export interface PostFormValues {
  title: string;
  content: string;
  summary: string;
  subject: string;
  imageUrl: string;
  link: string;
}

interface PostFormProps {
  initialValues?: Partial<PostFormValues>;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: PostFormValues) => void;
}

export default function PostForm({
  initialValues,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: PostFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [summary, setSummary] = useState(initialValues?.summary ?? "");
  const [subject, setSubject] = useState(initialValues?.subject ?? "");
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [link, setLink] = useState(initialValues?.link ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setValidationError("Informe um título para a publicação.");
      return;
    }

    if (!trimmedContent) {
      setValidationError("Informe o conteúdo da publicação.");
      return;
    }

    if (!subject) {
      setValidationError("Selecione uma matéria.");
      return;
    }

    setValidationError(null);
    onSubmit({
      title: trimmedTitle,
      content: trimmedContent,
      summary: summary.trim(),
      subject,
      imageUrl: imageUrl.trim(),
      link: link.trim(),
    });
  }

  const displayedError = validationError ?? errorMessage;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
    >
      <Text style={styles.label}>Título</Text>
      <TextInput
        accessibilityLabel="Título da publicação"
        editable={!isSubmitting}
        onChangeText={setTitle}
        placeholder="Título da publicação"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={title}
      />

      <Text style={styles.label}>Matéria</Text>
      <View style={styles.subjectGrid}>
        {Object.entries(SUBJECT_MAP).map(([key, info]) => {
          const isSelected = subject === key;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              key={key}
              onPress={() => setSubject(key)}
              style={({ pressed }) => [
                styles.subjectPill,
                isSelected && {
                  backgroundColor: info.color,
                  borderColor: info.color,
                },
                pressed && styles.pillPressed,
              ]}
            >
              <Text
                style={[
                  styles.subjectPillText,
                  isSelected && styles.subjectPillTextActive,
                ]}
              >
                {info.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Resumo (opcional)</Text>
      <TextInput
        accessibilityLabel="Resumo da publicação"
        editable={!isSubmitting}
        multiline
        numberOfLines={3}
        onChangeText={setSummary}
        placeholder="Resumo curto exibido no feed"
        placeholderTextColor="#94A3B8"
        style={[styles.input, styles.multilineInput]}
        value={summary}
      />

      <Text style={styles.label}>Conteúdo</Text>
      <TextInput
        accessibilityLabel="Conteúdo da publicação"
        editable={!isSubmitting}
        multiline
        numberOfLines={8}
        onChangeText={setContent}
        placeholder="Conteúdo completo da publicação"
        placeholderTextColor="#94A3B8"
        style={[styles.input, styles.multilineInput, styles.contentInput]}
        value={content}
      />

      <Text style={styles.label}>URL da imagem de capa (opcional)</Text>
      <TextInput
        accessibilityLabel="URL da imagem de capa"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
        keyboardType="url"
        onChangeText={setImageUrl}
        placeholder="https://..."
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={imageUrl}
      />

      <Text style={styles.label}>Link relacionado (opcional)</Text>
      <TextInput
        accessibilityLabel="Link relacionado"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
        keyboardType="url"
        onChangeText={setLink}
        placeholder="https://..."
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={link}
      />

      {displayedError ? (
        <Text accessibilityRole="alert" style={styles.errorMessage}>
          {displayedError}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          pressed && !isSubmitting && styles.submitButtonPressed,
          isSubmitting && styles.submitButtonDisabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
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
    ...Platform.select({
      web: {
        outlineStyle: "none" as never,
      },
    }),
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  contentInput: {
    minHeight: 160,
  },
  subjectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subjectPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillPressed: {
    transform: [{ scale: 0.94 }],
  },
  subjectPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  subjectPillTextActive: {
    color: "#FFFFFF",
  },
  errorMessage: {
    marginTop: 16,
    color: "#B42318",
    fontSize: 13,
    lineHeight: 19,
  },
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
