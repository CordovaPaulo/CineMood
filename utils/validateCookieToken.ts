import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt";
import { useRouter } from "next/navigation"; 

export async function validateCookieToken(): Promise<any | null> {
    const router = useRouter();

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("cinemood_auth_token");
    if (!tokenCookie) return null;

    const token = tokenCookie.value;
    const isValid = verifyToken(token);
    if (!isValid) {
        router.replace("/")
    };
    return isValid ? true : false;
}