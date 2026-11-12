import { useAuth } from '@/context/auth-context';
import { AdminHeader } from '@/screens/AdminHeader';
import { Student, studentsApi } from '@/services/students/students-api';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentsScreen() {
  const router = useRouter();
  const { isTeacher, session } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const sortedStudents = useMemo(
    () =>
    [...students].sort((a, b) => 
    a.name.trim().localeCompare(b.name.trim(), 'pt-BR', {sensitivity: 'base'})
  ),
  [students]
  );
  
  const loadStudents = useCallback(
    async (targetPage = 1, isRefresh = false, currentSession?: string | null) => {
      const activeSession = currentSession !== undefined ? currentSession : session;
      
      if (!activeSession) {
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await studentsApi.getStudents(targetPage, 10, activeSession);

        if (targetPage === 1) {
          setStudents(response.students);
        } else {
          setStudents((prev) => [...prev, ...response.students]);
        }

        setTotalPages(response.totalPages);
        setPage(response.page);
      } catch (error) {
        console.log('Erro detalhado ao carregar alunos na tela:', error);
        showMessage('Erro', 'Não foi possível carregar a lista de alunos.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session],
  );
  
  useFocusEffect(
    useCallback(() => {
      if (session) {
        loadStudents(1, false, session);
      }
    }, [session, loadStudents])
  );

  const handleRefresh = () => {
    loadStudents(1, true, session);
  };

  const handleEndReached = () => {
    if (loading || refreshing || page >= totalPages) return;
    loadStudents(page + 1, false, session);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction(
      'Excluir Aluno',
      'Tem certeza de que deseja remover este aluno? O acesso ao sistema será cancelado.',
      'Excluir',
    );
    if (!confirmed) return;

    try {
      await studentsApi.deleteStudent(id, session);
      showMessage('Sucesso', 'Aluno excluído com sucesso.');
      loadStudents(1, false, session);
    } catch (error) {
      console.log('Erro ao excluir aluno:', error);
      showMessage('Erro', 'Não foi possível excluir o aluno.');
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <StatusBar style="dark" />
      <AdminHeader
        activeTab="students"
        title="Alunos"
        subtitle="Cadastre e gerencie os alunos da escola"
        actionButton={
          isTeacher ? (
            <Pressable
              accessibilityLabel="Novo Aluno"
              accessibilityRole="button"
              onPress={() => router.push('/admin/students/form')}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.addButtonText}>+ Novo Aluno</Text>
            </Pressable>
          ) : null
        }
      />

      {loading && students.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2F68F5" />
        </View>
      ) : (
        <FlatList
          data={sortedStudents}
          style={styles.flatList}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentEmail}>{item.email}</Text>
              </View>

              {isTeacher && (
                <View style={styles.actionsContainer}>
                  <Pressable 
                    style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]} 
                    onPress={() => router.push(`/admin/students/form?id=${item.id}`)}
                  >
                    <Text style={styles.editButtonText}>Editar</Text>
                  </Pressable>

                  <Pressable 
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]} 
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>Excluir</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F8FF' 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F4F8FF'
  },
  addButton: { 
    backgroundColor: '#2F68F5', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  addButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 13 
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  listContainer: { 
    padding: 20 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 14, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000', 
    shadowOpacity: 0.03, 
    shadowRadius: 2, 
    elevation: 2 
  },
  cardInfo: { 
    flex: 1,
    marginRight: 10,
  },
  studentName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0F172A', 
    marginBottom: 4 
  },
  studentEmail: { 
    fontSize: 13, 
    color: '#64748B', 
    marginBottom: 2 
  },
  actionsContainer: { 
    flexDirection: 'row', 
    gap: 8 
  },
  editButton: { 
    backgroundColor: '#EBF3FF', 
    paddingHorizontal: 10, 
    paddingVertical: 7, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editButtonText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#2F68F5' 
  },
  deleteButton: { 
    backgroundColor: '#FEF2F2', 
    paddingHorizontal: 10, 
    paddingVertical: 7, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#DC2626' 
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#64748B', 
    fontSize: 14 
  },
  flatList: {
    flex: 1,
  }
});