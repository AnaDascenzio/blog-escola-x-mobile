import { useAuth } from '@/context/auth-context'; // Ajusta o caminho do teu auth se necessário
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { studentsApi } from '../../services/students/students-api';

export default function StudentFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const studentId = params?.id as string | undefined;
    const { session } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isEditing = Boolean(studentId);

    async function loadStudentData(id: string) {
        try {
            setLoading(true);
            const student = await studentsApi.getStudentById(id, session);
            if (student) {
                setName(student.name);
                setEmail(student.email);
                setRegistrationNumber(student.registrationNumber || '');
            }
        } catch (error) {
            console.log('Erro ao carregar dados do aluno:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do aluno.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (isEditing && studentId) {
            loadStudentData(studentId);
        }
    }, [studentId, session]);

    const handleSubmit = async () => {
        if (!name.trim() || !email.trim()) {
            Alert.alert('Atenção', 'Preencha os campos obrigatórios (Nome e E-mail).');
            return;
        }

        try {
            setSubmitting(true);
            if (isEditing && studentId) {
                await studentsApi.updateStudent(studentId, { name, email, registrationNumber }, session);
                Alert.alert('Sucesso', 'Aluno atualizado com sucesso!');
            } else {
                await studentsApi.createStudent({ name, email, registrationNumber }, session);
                Alert.alert('Sucesso', 'Aluno cadastrado com sucesso!');
            }
            router.back();
        } catch (error: any) {
            console.log('Erro detalhado ao salvar aluno:', error?.response?.data || error.message);
            const errorMessage = error?.response?.data?.message || error.message || 'Ocorreu um erro ao salvar os dados.';
            Alert.alert('Erro no Servidor', typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
            setSubmitting(false); 
        }
    };

    if (loading) {
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
                    <Text style={styles.eyebrow}>GESTÃO DE ALUNOS</Text>
                    <Text style={styles.title}>{isEditing ? 'Editar Aluno' : 'Novo Aluno'}</Text>
                </View>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
                <Text style={styles.label}>Nome Completo *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: João da Silva"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>E-mail *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: joao@escola.com"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <Text style={styles.label}>Matrícula</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 2026001"
                    placeholderTextColor="#94A3B8"
                    value={registrationNumber}
                    onChangeText={setRegistrationNumber}
                />

                <Pressable
                    style={({ pressed }) => [
                        styles.saveButton,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                        </Text>
                    )}
                </Pressable>
            </View>
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
        paddingHorizontal: 20,
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
        marginRight: 12,
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
    formContainer: {
        padding: 20,
    },
    label: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#334155', 
        marginBottom: 6 
    },
    input: { 
        backgroundColor: '#FFFFFF', 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        borderRadius: 10, 
        paddingHorizontal: 14, 
        paddingVertical: 12, 
        fontSize: 15, 
        color: '#0F172A',
        marginBottom: 16 
    },
    saveButton: { 
        backgroundColor: '#2F68F5', 
        paddingVertical: 14, 
        borderRadius: 10, 
        alignItems: 'center', 
        marginTop: 10,
        shadowColor: '#2F68F5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    saveButtonText: { 
        color: '#FFFFFF', 
        fontSize: 15, 
        fontWeight: '700' 
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
});