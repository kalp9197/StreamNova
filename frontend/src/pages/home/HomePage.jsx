import { useAuthStore } from "../../store/authUser";
import AuthScreen from "./AuthScreen";
import HomeScreen from "./HomeScreen";

const HomePage = () => {
<<<<<<< HEAD
	const { user } = useAuthStore();

	return <>{user ? <HomeScreen /> : <AuthScreen />}</>;
=======
  const { user } = useAuthStore();

  return <>{user ? <HomeScreen /> : <AuthScreen />}</>;
>>>>>>> 5ce791b (finalizing project and ready for deployment)
};
export default HomePage;
