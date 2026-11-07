import { useAuth } from "@/context/auth-context";
import { AdminHeader } from "@/screens/AdminHeader";
import {
  deactivateUser,
  listUsers,
  type User,
} from "@/services/users/users-api";
import { confirmAction, showMessage } from "@/utils/dialogs";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 10;

export default function TeachersListScreen() {
  const { session, user } = useAuth();

  const [teachers, setTeachers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Guarda a página atual para recarregar a mesma página ao voltar do formulário.
  const pageRef = useRef(1);

  const loadPage = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        let data = await listUsers("TEACHER", session, targetPage, PAGE_SIZE);
        // Se a página ficou vazia (ex.: excluiu o último item dela), volta uma.
        if (data.items.length === 0 && targetPage > 1) {
          data = await listUsers("TEACHER", session, targetPage - 1, PAGE_SIZE);
        }
        setTeachers(data.items);
        setPage(data.page);
        pageRef.current = data.page;
        setTotalPages(Math.max(data.totalPages, 1));
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  // Recarrega sempre que a tela volta ao foco (ex.: depois de salvar o formulário).
  useFocusEffect(
    useCallback(() => {
      loadPage(pageRef.current);
    }, [loadPage]),
  );

  async function handleDelete(teacher: User) {
    const confirmed = await confirmAction(
      "Excluir professor",
      `Deseja realmente excluir ${teacher.name}? O acesso ao sistema será removido.`,
      "Excluir",
    );
    if (!confirmed) return;

    setDeletingId(teacher.id);
    try {
      await deactivateUser(teacher.id, session);
      await loadPage(page);
    } catch (err) {
      showMessage(
        "Não foi possível excluir",
        err instanceof Error ? err.message : "Erro inesperado.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function renderItem({ item }: { item: User }) {
    const isDeleting = deletingId === item.id;
    // Impede o professor logado de excluir a própria conta (perderia o acesso na hora).
    const isCurrentUser = String(user?.id) === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
            {isCurrentUser ? <Text style={styles.youTag}> (você)</Text> : null}
          </Text>
          <Text style={styles.cardEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            accessibilityLabel={`Editar ${item.name}`}
            accessibilityRole="button"
            onPress={() => router.push(`/admin/teachers/${item.id}/edit`)}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
          {!isCurrentUser && (
            <Pressable
              accessibilityLabel={`Excluir ${item.name}`}
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={() => handleDelete(item)}
              style={({ pressed }) => [
                styles.deleteButton,
                (pressed || isDeleting) && styles.pressed,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.deleteButtonText}>Excluir</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <StatusBar style="dark" />
      <AdminHeader
        activeTab="teachers"
        title="Professores"
        subtitle="Cadastre e gerencie o corpo docente da escola"
        actionButton={
          <Pressable
            accessibilityLabel="Novo professor"
            accessibilityRole="button"
            onPress={() => router.push("/admin/teachers/new")}
            style={({ pressed }) => [
              styles.newButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.newButtonText}>+ Novo Professor</Text>
          </Pressable>
        }
      />

      {loading && teachers.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2F68F5" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => loadPage(page)}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.counter}>
              {total}{" "}
              {total === 1 ? "professor cadastrado" : "professores cadastrados"}
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum professor cadastrado.</Text>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <Pressable
                  disabled={page <= 1 || loading}
                  onPress={() => loadPage(page - 1)}
                  style={[
                    styles.paginationButton,
                    (page <= 1 || loading) && styles.paginationDisabled,
                  ]}
                >
                  <Text style={styles.paginationText}>← Anterior</Text>
                </Pressable>
                <Text style={styles.paginationInfo}>
                  Página {page} de {totalPages}
                </Text>
                <Pressable
                  disabled={page >= totalPages || loading}
                  onPress={() => loadPage(page + 1)}
                  style={[
                    styles.paginationButton,
                    (page >= totalPages || loading) &&
                      styles.paginationDisabled,
                  ]}
                >
                  <Text style={styles.paginationText}>Próxima →</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FF" },
  newButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#2F68F5",
  },
  newButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  pressed: { opacity: 0.75 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: { color: "#DC2626", textAlign: "center", marginBottom: 12 },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2F68F5",
  },
  retryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  listContent: { padding: 16, gap: 10 },
  counter: { fontSize: 12, color: "#64748B", marginBottom: 4 },
  emptyText: { textAlign: "center", color: "#64748B", marginTop: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  youTag: { fontSize: 13, fontWeight: "600", color: "#2F68F5" },
  cardEmail: { fontSize: 13, color: "#64748B", marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 8 },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#EFF4FF",
    borderWidth: 1,
    borderColor: "#BFD3FE",
  },
  editButtonText: { fontSize: 13, fontWeight: "700", color: "#2F68F5" },
  deleteButton: {
    minWidth: 64,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteButtonText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 20,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paginationDisabled: { opacity: 0.4 },
  paginationText: { fontSize: 13, fontWeight: "600", color: "#2F68F5" },
  paginationInfo: { fontSize: 13, color: "#64748B" },
});