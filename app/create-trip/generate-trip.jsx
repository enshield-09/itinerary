import { Image } from 'expo-image'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { useContext, useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { createChatSession } from '../../configs/AiModel'
import Colors from '../../constants/Colors'
import { buildFinalPrompt } from '../../constants/Options'
import { CreateTripContext } from '../../context/CreateTripContext'
import { auth, db } from './../../configs/FirebaseConfig'

export default function GenerateTrip() {
  const { tripData, setTripData } = useContext(CreateTripContext);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { docId: existingDocId } = useLocalSearchParams();
  const user = auth.currentUser;
  useEffect(() => {
    if (tripData?.locationInfo && tripData?.budget && tripData?.selectedAttractions?.length > 0) {
      GenerateAiTrip();
    } else {
      console.warn('Missing tripData fields:', tripData);
    }
  }, []);

  const GenerateAiTrip = async () => {
    setLoading(true);
    const FINAL_PROMPT = buildFinalPrompt(tripData);
    console.log("FINAL_PROMPT:", FINAL_PROMPT);

    try {
      const chatSession = await createChatSession(tripData);
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      const responseText = result.response.text();

      console.log("========== AI RESPONSE START ==========");
      console.log(responseText);
      console.log("========== AI RESPONSE END ==========");

      if (!responseText || responseText.trim() === '') {
        throw new Error('AI response is empty');
      }

      // 1. Remove markdown code blocks
      let cleanedText = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // 2. Remove JavaScript-style comments (// and /* */)
      cleanedText = cleanedText
        .replace(/\/\/.*/g, '')  // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove multi-line comments

      // 3. Find the JSON object boundaries
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        console.error("No valid JSON braces found");
        console.error("Response after cleaning:", cleanedText.substring(0, 500));
        throw new Error('No valid JSON structure found in AI response');
      }

      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);

      // 4. Fix specific known AI malformations
      // Fix truncated image_url: "https: \n -> "image_url": null,\n
      cleanedText = cleanedText.replace(/"image_url":\s*"https:\s*(?=["}])/g, '"image_url": null,');
      // Fix missing closing quote on image_url lines that end abruptly
      cleanedText = cleanedText.replace(/"image_url":\s*"https:[^"]*$/gm, (match) => match + '",');
      // Fix truncated booking_url
      cleanedText = cleanedText.replace(/"booking_url":\s*"https:\s*(?=["}])/g, '"booking_url": null,');
      cleanedText = cleanedText.replace(/"booking_url":\s*"https:[^"]*$/gm, (match) => match + '",');

      // 5. Escape unescaped control characters within strings
      // This regex matches a quote, then any number of non-quote characters, finding unescaped newlines/tabs
      // Note: This is an approximation. A perfect parser starts to become a parser itself.
      // Simpler approach: Replace literal newlines not followed by indentation with \n
      // But preserving structure is key.

      // Better approach for the specific error "U+0000...":
      // Replace literal standard newlines (\r\n or \n) inside strings with \\n
      // identifying strings is hard with regex. 
      // safe fallback: if JSON.parse fails, we use a custom cleaner in the catch block?

      // 5. AGGRESSIVE CLEANING: Replace all control characters (newlines, tabs) with spaces
      // This fixes "U+0000 thru U+001F" errors.
      cleanedText = cleanedText.replace(/[\n\r\t]/g, ' ');

      // 6. Remove trailing commas before closing braces/brackets
      cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');

      console.log("========== CLEANED JSON (first 1000 chars) ==========");
      console.log(cleanedText.substring(0, 1000));
      console.log("========== END CLEANED JSON ==========");

      // 7. Parse JSON with auto-repair for truncation
      let tripResp;
      try {
        tripResp = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Initial JSON Parse Error:", parseError.message);

        // Auto-fix truncation: "Unexpected end of input" usually means missing closing brackets
        if (parseError.message.includes("Unexpected end of input") || parseError.message.includes("JSON Parse error: Unexpected EOF")) {
          console.log("Attempting to fix truncated JSON...");
          const closers = ['}', ']', '"}', '"]', '}}', ']}', '}}]', '}]}', '}'];
          let fixed = false;
          for (const closer of closers) {
            try {
              tripResp = JSON.parse(cleanedText + closer);
              console.log("Fixed JSON by appending:", closer);
              fixed = true;
              break;
            } catch (e) { }
          }
          if (!fixed) {
            // Try counting braces to guess closer?
            // Simple count:
            const openBraces = (cleanedText.match(/{/g) || []).length;
            const closeBraces = (cleanedText.match(/}/g) || []).length;
            const openBrackets = (cleanedText.match(/\[/g) || []).length;
            const closeBrackets = (cleanedText.match(/\]/g) || []).length;

            let suffix = '';
            for (let i = 0; i < (openBraces - closeBraces); i++) suffix += '}';
            for (let i = 0; i < (openBrackets - closeBrackets); i++) suffix += ']';

            try {
              tripResp = JSON.parse(cleanedText + suffix);
              console.log("Fixed JSON by balancing braces:", suffix);
              fixed = true;
            } catch (e) { }
          }

          if (!fixed) throw parseError; // Rethrow if couldn't fix
        } else {
          throw parseError;
        }
      }

      console.log("Successfully parsed JSON!");

      // 4. Save to Firestore
      const docId = existingDocId || Date.now().toString();

      const saveData = {
        userEmail: user.email,
        tripPlan: tripResp,
        tripData: JSON.stringify(tripData),
        docId: docId
      };

      if (existingDocId) {
        await updateDoc(doc(db, "ItineraryApp", docId), saveData);
        router.replace({ pathname: '/trip-details', params: { docId } });
      } else {
        await setDoc(doc(db, "ItineraryApp", docId), saveData);
        router.replace('/mytrip');
      }

    } catch (err) {
      console.error('Trip generation error:', err);
      Alert.alert(
        'Trip Generation Failed',
        'We encountered an issue generating your trip. Please try again.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back()
          },
          {
            text: 'Retry',
            onPress: () => GenerateAiTrip()
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{
      padding: 25,
      paddingTop: 75,
      backgroundColor: Colors.WHITE,
      height: '100%'
    }}>
      <Text style={{
        fontSize: 35,
        fontFamily: 'outfit-bold',
        marginTop: 25,
        textAlign: 'center',
        color: Colors.BLACK
      }}>Please Wait...</Text>

      <Text style={{
        fontFamily: 'outfit-medium',
        fontSize: 20,
        marginTop: 40,
        textAlign: 'center',
        color: Colors.GRAY
      }}>We are working to generate your dream trip</Text>
      <Image source={require('./../../assets/images/loading.gif')}
        style={{
          width: '100%',
          height: 300,
          objectFit: 'contain',
          marginVertical: 20
        }} />
      <Text style={{
        fontFamily: 'outfit',
        fontSize: 18,
        textAlign: 'center',
        color: Colors.GRAY
      }}>Do not Go Back</Text>
    </View>
  )
}