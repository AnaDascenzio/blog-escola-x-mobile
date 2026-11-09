import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  getPostImageUrl,
  SUBJECT_MAP,
  type SelectedImageFile,
} from "@/services/posts/posts-api";

export interface PostFormValues {
  title: string;
  content: string;
  summary: string;
  subject: string;
  imageUrl: string;
  link: string;
  imageFile?: SelectedImageFile | null;
}

interface PostFormProps {
  initialValues?: Partial<PostFormValues>;
  // Somente exibição: o back-end define o autor pelo token de quem cria o post.
  authorName: string;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: PostFormValues) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function PostForm({
  initialValues,
  authorName,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
  onDelete,
  isDeleting = false,
}: PostFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [summary, setSummary] = useState(initialValues?.summary ?? "");
  const [subject, setSubject] = useState(initialValues?.subject ?? "");
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [link, setLink] = useState(initialValues?.link ?? "");
  const [selectedFile, setSelectedFile] = useState<SelectedImageFile | null>(
    null,
  );
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  async function handlePickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const extension = asset.uri.split(".").pop()?.split("?")[0] || "jpg";
        const fileName = asset.fileName || `upload_${Date.now()}.${extension}`;
        const mimeType =
          asset.mimeType ||
          (extension.toLowerCase() === "png"
            ? "image/png"
            : extension.toLowerCase() === "webp"
              ? "image/webp"
              : "image/jpeg");

        setSelectedFile({
          uri: asset.uri,
          name: fileName,
          mimeType,
          base64: asset.base64,
          file: (asset as { file?: unknown }).file,
        });
        setValidationError(null);
      }
    } catch {
      setValidationError("Não foi possível acessar a galeria de fotos.");
    }
  }

  function handleRemoveImage() {
    setSelectedFile(null);
    setImageUrl("");
  }

  const previewUri =
    selectedFile?.uri || (imageUrl ? getPostImageUrl({ imageUrl }) : null);

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
      imageFile: selectedFile,
    });
  }

  const displayedError = validationError ?? errorMessage;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80 },
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
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

      <Text style={styles.label}>Autor</Text>
      <View style={[styles.input, styles.readOnlyField]}>
        <Text numberOfLines={1} style={styles.readOnlyText}>
          {authorName}
        </Text>
      </View>
      <Text style={styles.hint}>
        Preenchido automaticamente e não pode ser alterado.
      </Text>

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
        scrollEnabled={false}
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
        scrollEnabled={false}
        style={[styles.input, styles.multilineInput, styles.contentInput]}
        value={content}
      />

      <Text style={styles.label}>Imagem de capa (opcional)</Text>
      {previewUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image
            resizeMode="cover"
            source={{ uri: previewUri }}
            style={styles.imagePreview}
          />
          <Pressable
            accessibilityLabel="Remover imagem"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleRemoveImage}
            style={({ pressed }) => [
              styles.removeImageButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.removeImageText}>✕ Remover imagem</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.uploadContainer}>
          <Pressable
            accessibilityHint="Toque para abrir a galeria e escolher uma imagem"
            accessibilityLabel="Selecionar arquivo do dispositivo"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.uploadZone,
              pressed && styles.uploadZonePressed,
            ]}
          >
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.uploadTitle}>
              Selecionar imagem do dispositivo
            </Text>
            <Text style={styles.uploadSubtitle}>
              Compatível com Android, iOS e Web (PNG, JPG, WEBP • máx. 5MB)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowUrlInput((prev) => !prev)}
            style={styles.toggleUrlButton}
          >
            <Text style={styles.toggleUrlText}>
              {showUrlInput
                ? "▲ Ocultar campo de URL externa"
                : "▼ Ou inserir URL externa da imagem"}
            </Text>
          </Pressable>

          {showUrlInput ? (
            <TextInput
              accessibilityLabel="URL da imagem de capa"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="url"
              onChangeText={setImageUrl}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              style={[styles.input, { marginTop: 8 }]}
              value={imageUrl}
            />
          ) : null}
        </View>
      )}

      <Text style={styles.label}>Link relacionado (opcional)</Text>
      <TextInput
        accessibilityLabel="Link relacionado"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
        keyboardType="url"
        onChangeText={setLink}
        onFocus={() => {
          setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }}
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
        disabled={isSubmitting || isDeleting}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          pressed && !isSubmitting && !isDeleting && styles.submitButtonPressed,
          (isSubmitting || isDeleting) && styles.submitButtonDisabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </Pressable>

      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting || isDeleting}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && !isSubmitting && !isDeleting && styles.deleteButtonPressed,
            (isSubmitting || isDeleting) && styles.deleteButtonDisabled,
          ]}
        >
          {isDeleting ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <Text style={styles.deleteButtonText}>Excluir publicação</Text>
          )}
        </Pressable>
      ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
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
  readOnlyField: {
    backgroundColor: "#EEF3FA",
  },
  readOnlyText: {
    fontSize: 14,
    color: "#475569",
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
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
  deleteButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  deleteButtonPressed: {
    backgroundColor: "#FEE2E2",
    transform: [{ scale: 0.985 }],
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700",
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#D8E4F2",
    backgroundColor: "#F8FAFC",
    marginBottom: 8,
  },
  imagePreview: {
    width: "100%",
    height: 180,
    backgroundColor: "#E2E8F0",
  },
  removeImageButton: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderTopWidth: 1,
    borderTopColor: "#FECACA",
  },
  removeImageText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  uploadContainer: {
    marginBottom: 4,
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#2F68F5",
    borderRadius: 12,
    backgroundColor: "#F4F8FF",
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadZonePressed: {
    backgroundColor: "#EBF3FF",
    transform: [{ scale: 0.99 }],
  },
  uploadIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2F68F5",
    marginBottom: 2,
    textAlign: "center",
  },
  uploadSubtitle: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  toggleUrlButton: {
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 4,
  },
  toggleUrlText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
});
