import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useAuth } from '../../context/auth-context';
import { Student, studentsApi } from '../../services/students/students-api';

export default function StudentsScreen() {
  const router = useRouter();
  const { isTeacher, session } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  
  const loadStudents = async (targetPage = 1, isRefresh = false, currentSession?: string | null) => {
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

      console.log('Buscando alunos com o token...');
      const response = await studentsApi.getStudents(targetPage, 10, activeSession);
      console.log('Alunos carregados com sucesso:', response.students);

      if (targetPage === 1) {
        setStudents(response.students);
      } else {
        setStudents((prev) => [...prev, ...response.students]);
      }

      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (error) {
      console.log('Erro detalhado ao carregar alunos na tela:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de alunos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
  useEffect(() => {
    if (session) {
      loadStudents(1, false, session);
    }
  }, [session]);

  const handleRefresh = () => {
    loadStudents(1, true, session);
  };

  const handleEndReached = () => {
    if (loading || refreshing || page >= totalPages) return;
    loadStudents(page + 1, false, session);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tens a certeza que pretendes remover este aluno?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await studentsApi.deleteStudent(id, session);
              Alert.alert('Sucesso', 'Aluno excluído com sucesso.');
              loadStudents(1, false, session);
            } catch (error) {
              console.log('Erro ao excluir aluno:', error);
              Alert.alert('Erro', 'Não foi possível excluir o aluno.');
            }
          } 
        }
      ]
    );
  };

  if (loading && students.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2F68F5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho Padronizado */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={styles.backButtonArrow}>←</Text>
        </Pressable>
        
        <View style={styles.headerTitles}>
          <Text style={styles.eyebrow}>PAINEL ADMINISTRATIVO</Text>
          <Text style={styles.title}>Módulo de Alunos</Text>
        </View>

        {isTeacher && (
          <Pressable 
            style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]} 
            onPress={() => router.push('/students/form')}
          >
            <Text style={styles.addButtonText}>+ Novo Aluno</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={students}
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
              {item.registrationNumber ? (
                <Text style={styles.studentMatricula}>Matrícula: {item.registrationNumber}</Text>
              ) : null}
            </View>

            {isTeacher && (
              <View style={styles.actionsContainer}>
                <Pressable 
                  style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]} 
                  onPress={() => router.push(`/students/form?id=${item.id}`)}
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
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBF6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.82,
  },
  backButtonArrow: {
    fontSize: 16,
    color: '#2F68F5',
    fontWeight: '600',
  },
  headerTitles: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#2F68F5',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  addButton: { 
    backgroundColor: '#2F68F5', 
    paddingHorizontal: 12, 
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
  studentMatricula: { 
    fontSize: 12, 
    color: '#94A3B8',
    fontWeight: '600'
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