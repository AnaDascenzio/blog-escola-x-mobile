import { router } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type AdminTab = "posts" | "students" | "teachers";

interface AdminHeaderProps {
  activeTab: AdminTab;
  title: string;
  subtitle?: string;
  actionButton?: ReactNode;
}

export function AdminHeader({
  activeTab,
  title,
  subtitle,
  actionButton,
}: AdminHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Linha 1: Voltar ao Feed e Ação Primária da Tela */}
      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel="Voltar ao Feed"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => router.replace("/home")}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backButtonArrow}>←</Text>
          <Text style={styles.backButtonText}>Feed</Text>
        </Pressable>

        {actionButton ? <View style={styles.actionContainer}>{actionButton}</View> : null}
      </View>

      {/* Linha 2: Título com 100% de largura livre */}
      <View style={styles.titleSection}>
        <Text style={styles.eyebrow}>PAINEL ADMINISTRATIVO</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {/* Linha 3: Barra de Navegação entre os 3 Módulos de Gestão */}
      <View style={styles.tabsWrapper}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "posts" }}
          onPress={() => {
            if (activeTab !== "posts") router.replace("/admin/posts");
          }}
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === "posts" && styles.tabItemActive,
            pressed && styles.tabPressed,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "posts" && styles.tabTextActive,
            ]}
          >
             Publicações
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "students" }}
          onPress={() => {
            if (activeTab !== "students") router.replace("/admin/students");
          }}
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === "students" && styles.tabItemActive,
            pressed && styles.tabPressed,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "students" && styles.tabTextActive,
            ]}
          >
             Alunos
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "teachers" }}
          onPress={() => {
            if (activeTab !== "teachers") router.replace("/admin/teachers");
          }}
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === "teachers" && styles.tabItemActive,
            pressed && styles.tabPressed,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "teachers" && styles.tabTextActive,
            ]}
          >
             Professores
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#F4F8FF",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2EBF6",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  backButtonArrow: {
    fontSize: 15,
    color: "#2F68F5",
    fontWeight: "700",
    marginRight: 4,
  },
  backButtonText: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "600",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleSection: {
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#2F68F5",
    marginBottom: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: "#E2EBF6",
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  tabItemActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#2F68F5",
    fontWeight: "700",
  },
  tabPressed: {
    opacity: 0.8,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
});
