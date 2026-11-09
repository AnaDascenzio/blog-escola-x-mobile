import { useAuth } from '@/context/auth-context';
import { studentsApi } from '@/services/students/students-api';
import { showMessage } from '@/utils/dialogs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StudentFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const studentId = params?.id as string | undefined;
    const { session } = useAuth();

    const isEditing = Boolean(studentId);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isEditing || !studentId) return;
        let active = true;

        studentsApi.getStudentById(studentId, session)
            .then((student) => {
                if (!active || !student) return;
                setName(student.name);
                setEmail(student.email);
            })
            .catch((error) => {
                if (active) {
                    console.log('Erro ao carregar dados do aluno:', error);
                    showMessage('Erro', 'Não foi possível carregar os dados do aluno.');
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [isEditing, studentId, session]);

    const handleSubmit = async () => {
        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = password.trim();

        if (!normalizedName || !normalizedEmail) {
            showMessage('Atenção', 'Preencha os campos obrigatórios (Nome e E-mail).');
            return;
        }

        if (normalizedName.length < 3) {
            showMessage('Atenção', 'O nome precisa ter pelo menos 3 caracteres.');
            return;
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            showMessage('Atenção', 'Informe um e-mail válido.');
            return;
        }

        if (normalizedPassword.length > 0 && normalizedPassword.length < 6) {
            showMessage('Atenção', 'A senha precisa ter pelo menos 6 caracteres.');
            return;
        }

        try {
            setSubmitting(true);
            if (isEditing && studentId) {
                const payload: { name: string; email: string; password?: string } = {
                    name: normalizedName,
                    email: normalizedEmail,
                };
                if (normalizedPassword) {
                    payload.password = normalizedPassword;
                }
                await studentsApi.updateStudent(studentId, payload, session);
                showMessage('Sucesso', 'Aluno atualizado com sucesso!');
            } else {
                await studentsApi.createStudent(
                    {
                        name: normalizedName,
                        email: normalizedEmail,
                        password: normalizedPassword || '123456',
                    },
                    session
                );
                showMessage('Sucesso', 'Aluno cadastrado com sucesso!');
            }
            router.back();
        } catch (error: any) {
            console.log('Erro detalhado ao salvar aluno:', error?.response?.data || error.message);
            const rawMessage = error?.response?.data?.message || error.message || 'Ocorreu um erro ao salvar os dados.';
            const messageStr = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
            const errorMessage =
                messageStr.includes('unique constraint') ||
                messageStr.includes('duplicate key') ||
                messageStr.includes('users_email_key')
                    ? 'E-mail já cadastrado.'
                    : messageStr;
            showMessage('Erro', errorMessage);
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
        <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
            {/* Cabeçalho Padronizado */}
            <View style={styles.header}>
                <Pressable
                    accessibilityLabel="Voltar"
                    accessibilityRole="button"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

            {/* Formulário com Suporte a Scroll e Teclado Mobile */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.formContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.label}>Nome Completo *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: João da Silva"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>E-mail *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: joao@escola.com"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>
                        {isEditing ? 'Nova Senha (opcional)' : 'Senha (opcional)'}
                    </Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={
                                isEditing
                                    ? 'Deixe em branco para manter a atual'
                                    : 'Mínimo 6 caracteres (padrão: 123456)'
                            }
                            placeholderTextColor="#94A3B8"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            textContentType="newPassword"
                            value={password}
                            onChangeText={setPassword}
                        />
                        <Pressable
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                            accessibilityRole="button"
                            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                            hitSlop={8}
                        >
                            <Text style={styles.eyeButtonText}>{showPassword ? 'Ocultar' : 'Exibir'}</Text>
                        </Pressable>
                    </View>
                    <Text style={styles.helperText}>
                        {isEditing
                            ? 'Preencha apenas se desejar redefinir a senha do aluno (mínimo 6 caracteres).'
                            : 'Se deixar em branco, o aluno será cadastrado com a senha padrão 123456.'}
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            pressed && styles.buttonPressed,
                            submitting && styles.buttonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        accessibilityRole="button"
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>
                                {isEditing ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                            </Text>
                        )}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F8FF',
    },
    flex: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F8FF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
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
        paddingBottom: 40,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 6,
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
        marginBottom: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        marginBottom: 4,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#0F172A',
    },
    eyeButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    eyeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2F68F5',
    },
    helperText: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: '#2F68F5',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#2F68F5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
