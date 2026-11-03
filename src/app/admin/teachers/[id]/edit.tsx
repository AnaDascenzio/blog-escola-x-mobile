import { useLocalSearchParams } from "expo-router";
import TeacherFormScreen from "@/screens/TeacherFormScreen";

export default function EditTeacherRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <TeacherFormScreen id={id ?? ""} />;
}