import { useAuth } from "@/context/auth-context";
import {
  formatPostDate,
  getPosts,
  getSubjectInfo,
  SUBJECT_MAP,
  type Post,
} from "@/services/posts/posts-api";
import { getUserById } from "@/services/users/users-api";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar as RNStatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 6;

const SKELETON_ITEMS = [
  { id: "skeleton-1" },
  { id: "skeleton-2" },
  { id: "skeleton-3" },
];

function SkeletonCard() {
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Animated.View style={[styles.skeletonBadge, { opacity }]} />
        <Animated.View style={[styles.skeletonDate, { opacity }]} />
      </View>
      <Animated.View style={[styles.skeletonTitle, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, { opacity }]} />
      <Animated.View style={[styles.skeletonLineShort, { opacity }]} />
      <View style={styles.cardFooter}>
        <Animated.View style={[styles.skeletonAuthor, { opacity }]} />
        <Animated.View style={[styles.skeletonAction, { opacity }]} />
      </View>
    </View>
  );
}

export default function PostsScreen() {
  const { session, signOut, isTeacher, user } = useAuth();
  const [fetchedName, setFetchedName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.name && user?.id && session) {
      let isMounted = true;
      getUserById(String(user.id), session)
        .then((profile) => {
          if (isMounted && profile?.name) {
            setFetchedName(profile.name);
          }
        })
        .catch(() => {
          // Ignora erro em caso de perda de conexão
        });

      return () => {
        isMounted = false;
      };
    }
  }, [user?.id, user?.name, session]);

  const displayName =
    user?.name || fetchedName || (user?.email ? user.email.split("@")[0] : "Escola X");

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const filterScrollRef = useRef<ScrollView>(null);

  // Ordena os filtros posicionando a disciplina selecionada imediatamente à direita de "Todos"
  const orderedSubjectEntries = useMemo(() => {
    const entries = Object.entries(SUBJECT_MAP);
    if (selectedSubject === "ALL") {
      return entries;
    }
    const selectedEntry = entries.find(([key]) => key === selectedSubject);
    const otherEntries = entries.filter(([key]) => key !== selectedSubject);
    return selectedEntry ? [selectedEntry, ...otherEntries] : entries;
  }, [selectedSubject]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const fetchPosts = useCallback(
    (currentPage: number, currentSubject: string, authToken?: string | null) => {
      let isMounted = true;
      const subjectParam = currentSubject === "ALL" ? undefined : currentSubject;

      getPosts(authToken, currentPage, PAGE_SIZE, subjectParam)
        .then((response) => {
          if (isMounted) {
            setPosts(response.post ?? []);
            const nextTotal = response.total ?? 0;
            setTotal(nextTotal);
            setErrorMessage(null);

            const lastPage = Math.ceil(nextTotal / PAGE_SIZE) || 1;
            if (currentPage > lastPage) {
              setPage(lastPage);
            }
          }
        })
        .catch((error: unknown) => {
          if (isMounted) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Não foi possível carregar as publicações.",
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        });

      return () => {
        isMounted = false;
      };
    },
    [],
  );

  // Recarrega ao voltar para a tela ou trocar página/matéria
  useFocusEffect(
    useCallback(() => {
      return fetchPosts(page, selectedSubject, session);
    }, [fetchPosts, page, selectedSubject, session]),
  );

  function handleSelectSubject(subjectKey: string) {
    const nextSubject = subjectKey === selectedSubject ? "ALL" : subjectKey;
    setSelectedSubject(nextSubject);
    setPage(1);
    setIsLoading(true);
    fetchPosts(1, nextSubject, session);
    requestAnimationFrame(() => {
      filterScrollRef.current?.scrollTo({ x: 0, animated: true });
    });
  }

  function handleRefresh() {
    setIsRefreshing(true);
    fetchPosts(page, selectedSubject, session);
  }

  function handleRetry() {
    setIsLoading(true);
    setErrorMessage(null);
    fetchPosts(page, selectedSubject, session);
  }

  function handleClearFilters() {
    setSearchTerm("");
    setSelectedSubject("ALL");
    setPage(1);
    setIsLoading(true);
    fetchPosts(1, "ALL", session);
    requestAnimationFrame(() => {
      filterScrollRef.current?.scrollTo({ x: 0, animated: true });
    });
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      // Fallback
    } finally {
      setIsSigningOut(false);
    }
  }

  // Filtragem local complementar por termo de busca (título, resumo/conteúdo ou autor) e matéria
  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return posts
      .filter((post) => !post.isDeleted)
      .filter((post) => {
        if (selectedSubject !== "ALL" && post.subject !== selectedSubject) {
          return false;
        }
        if (!term) return true;

        return (
          post.title.toLowerCase().includes(term) ||
          post.content.toLowerCase().includes(term) ||
          (post.summary?.toLowerCase().includes(term) ?? false) ||
          (post.author?.name?.toLowerCase().includes(term) ?? false)
        );
      });
  }, [posts, searchTerm, selectedSubject]);

  function handleOpenPost(postId: string) {
    router.push({
      pathname: "/post/[id]",
      params: { id: postId },
    });
  }

  // Cabeçalho rolável unificado dentro do FlatList
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Barra superior de identidade e ações */}
      <View style={styles.topBar}>
        <View style={styles.userProfile}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>🎓</Text>
          </View>
          <View style={styles.userInfo}>
            <Text numberOfLines={1} style={styles.brandTitle}>
              {displayName}
            </Text>
            <Text style={styles.userRoleBadge}>
              {isTeacher ? " Professor" : " Aluno"}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {isTeacher ? (
            <Pressable
              accessibilityHint="Abre o painel de gestão da escola"
              accessibilityLabel="Painel de Gestão"
              accessibilityRole="button"
              onPress={() => router.push("/admin/posts")}
              style={({ pressed }) => [
                styles.gestaoButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.gestaoIcon}> </Text>
              <Text style={styles.gestaoButtonText}>Gestão</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityHint="Encerra a sessão atual"
            accessibilityLabel="Sair da conta"
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.buttonPressed,
            ]}
          >
            {isSigningOut ? (
              <ActivityIndicator color="#DC2626" size="small" />
            ) : (
              <Text style={styles.signOutButtonText}>Sair</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Título com largura total */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Feed de Publicações</Text>
        <Text style={styles.pageSubtitle}>
          Acompanhe os conteúdos e avisos da comunidade escolar
        </Text>
      </View>

      {/* Barra de Busca */}
      <View
        style={[
          styles.searchContainer,
          isSearchFocused && styles.searchContainerFocused,
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          accessibilityLabel="Buscar publicações"
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={() => setIsSearchFocused(false)}
          onChangeText={setSearchTerm}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="Buscar posts por palavra-chave ou autor..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={searchTerm}
        />
        {searchTerm.length > 0 ? (
          <Pressable
            accessibilityLabel="Limpar busca"
            accessibilityRole="button"
            onPress={() => setSearchTerm("")}
            style={({ pressed }) => [
              styles.clearSearchButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Carrossel Horizontal por Disciplina */}
      <View style={styles.filterSection}>
        <ScrollView
          ref={filterScrollRef}
          contentContainerStyle={styles.filterScroll}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => handleSelectSubject("ALL")}
            style={({ pressed }) => [
              styles.filterPill,
              selectedSubject === "ALL" && styles.filterPillActive,
              pressed && styles.pillPressed,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedSubject === "ALL" && styles.filterPillTextActive,
              ]}
            >
              Todos
            </Text>
          </Pressable>

          {orderedSubjectEntries.map(([key, info]) => {
            const isSelected = selectedSubject === key;
            return (
              <Pressable
                accessibilityRole="button"
                key={key}
                onPress={() => handleSelectSubject(key)}
                style={({ pressed }) => [
                  styles.filterPill,
                  isSelected && {
                    backgroundColor: info.color,
                    borderColor: info.color,
                  },
                  pressed && styles.pillPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {isSelected ? `✓ ${info.label}` : info.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={
          isLoading && !isRefreshing
            ? (SKELETON_ITEMS as unknown as Post[])
            : filteredPosts
        }
        keyboardShouldPersistTaps="always"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          errorMessage ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Não foi possível carregar</Text>
              <Text style={styles.stateSubtitle}>{errorMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleRetry}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>▤</Text>
              <Text style={styles.emptyTitle}>Nenhuma publicação encontrada</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm || selectedSubject !== "ALL"
                  ? "Tente buscar por outro termo ou escolher outra disciplina."
                  : "Ainda não há publicações disponíveis no momento."}
              </Text>
              {searchTerm || selectedSubject !== "ALL" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleClearFilters}
                  style={({ pressed }) => [
                    styles.clearFiltersButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.clearFiltersButtonText}>
                    Limpar filtros
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null
        }
        ListFooterComponent={
          !isLoading && totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <Pressable
                accessibilityRole="button"
                disabled={page <= 1}
                onPress={() => {
                  const prevPage = Math.max(1, page - 1);
                  setPage(prevPage);
                  setIsLoading(true);
                  fetchPosts(prevPage, selectedSubject, session);
                }}
                style={({ pressed }) => [
                  styles.paginationButton,
                  page <= 1 && styles.paginationButtonDisabled,
                  pressed && page > 1 && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    page <= 1 && styles.paginationButtonTextDisabled,
                  ]}
                >
                  Anterior
                </Text>
              </Pressable>

              <Text style={styles.paginationText}>
                Página {page} de {totalPages}
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={page >= totalPages}
                onPress={() => {
                  const nextPage = Math.min(totalPages, page + 1);
                  setPage(nextPage);
                  setIsLoading(true);
                  fetchPosts(nextPage, selectedSubject, session);
                }}
                style={({ pressed }) => [
                  styles.paginationButton,
                  page >= totalPages && styles.paginationButtonDisabled,
                  pressed && page < totalPages && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    page >= totalPages && styles.paginationButtonTextDisabled,
                  ]}
                >
                  Próxima
                </Text>
              </Pressable>
            </View>
          ) : null
        }
        ListHeaderComponent={renderHeader()}
        refreshControl={
          <RefreshControl
            colors={["#2F68F5"]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor="#2F68F5"
          />
        }
        renderItem={({ item }) => {
          if (isLoading && !isRefreshing) {
            return <SkeletonCard />;
          }

          const subjectInfo = getSubjectInfo(item.subject);
          const dateStr = formatPostDate(item.createdAt, "short");
          const authorName = item.author?.name ?? "Professor(a) responsável";
          const summaryText =
            item.summary ||
            (item.content ? item.content.slice(0, 120) + "..." : "");

          return (
            <Pressable
              accessibilityHint="Toque para ler a publicação completa"
              accessibilityLabel={`Publicação: ${item.title}`}
              accessibilityRole="button"
              onPress={() => handleOpenPost(item.id)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.subjectBadge,
                    { backgroundColor: subjectInfo.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.subjectBadgeText,
                      { color: subjectInfo.color },
                    ]}
                  >
                    {subjectInfo.label}
                  </Text>
                </View>

                {dateStr ? (
                  <Text style={styles.postDate}>{dateStr}</Text>
                ) : null}
              </View>

              <Text style={styles.postTitle}>{item.title}</Text>

              <Text numberOfLines={3} style={styles.postSummary}>
                {summaryText}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.authorContainer}>
                  <View style={styles.authorBadge}>
                    <Text style={styles.authorInitial}>
                      {authorName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={styles.postAuthor}>
                    {authorName}
                  </Text>
                </View>

                <View style={styles.readMoreWrapper}>
                  <Text style={styles.readMoreText}>Ler post completo →</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {isTeacher ? (
        <Pressable
          accessibilityHint="Criar uma nova publicação"
          accessibilityLabel="Novo post"
          accessibilityRole="button"
          onPress={() => router.push("/admin/posts/new")}
          style={({ pressed }) => [
            styles.fabButton,
            pressed && styles.fabButtonPressed,
          ]}
        >
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabText}>Novo Post</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8FF",
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight ? 6 : 0) : 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 8,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 4,
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF4FF",
    borderWidth: 1.5,
    borderColor: "#D8E6FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
  },
  userInfo: {
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  userRoleBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gestaoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 5,
  },
  gestaoIcon: {
    fontSize: 13,
  },
  gestaoButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2F68F5",
  },
  signOutButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  signOutButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  fabButton: {
    position: "absolute",
    bottom: 24,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2F68F5",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    shadowColor: "#2F68F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
    gap: 8,
  },
  fabButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  fabIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 22,
    marginTop: -2,
  },
  fabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  titleSection: {
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    height: 48,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchContainerFocused: {
    borderColor: "#2F68F5",
    backgroundColor: "#FAFCFF",
    shadowOpacity: 0.08,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    height: "100%",
    ...Platform.select({
      web: {
        outlineStyle: "none" as never,
      },
    }),
  },
  clearSearchButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  clearSearchText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
  },
  filterSection: {
    marginBottom: 14,
    marginHorizontal: -20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterPillActive: {
    backgroundColor: "#2F68F5",
    borderColor: "#2F68F5",
    shadowColor: "#2F68F5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  pillPressed: {
    transform: [{ scale: 0.94 }],
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    borderColor: "#CBD5E1",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  postDate: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  postTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 24,
    marginBottom: 8,
  },
  postSummary: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    gap: 7,
  },
  authorBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#D8E6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  authorInitial: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2F68F5",
  },
  postAuthor: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    flexShrink: 1,
  },
  readMoreWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2F68F5",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paginationButtonDisabled: {
    opacity: 0.45,
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2F68F5",
  },
  paginationButtonTextDisabled: {
    color: "#94A3B8",
  },
  paginationText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 36,
    color: "#94A3B8",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
  },
  clearFiltersButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  clearFiltersButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2F68F5",
  },
  stateCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 10,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  stateSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#2F68F5",
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  skeletonBadge: {
    width: 70,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
  },
  skeletonDate: {
    width: 60,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonTitle: {
    width: "85%",
    height: 20,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
    marginBottom: 12,
  },
  skeletonLine: {
    width: "100%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    marginBottom: 8,
  },
  skeletonLineShort: {
    width: "70%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },
  skeletonAuthor: {
    width: 100,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonAction: {
    width: 90,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
});
