import { Camera, CameraView } from 'expo-camera';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type QuestionData = {
  img_src?: string;
  question: string;
  hint?: string;
  responseType?: string;
  choices?: string[];
  pointsRewarded?: number[];
  url?: string;
  ['Age group']?: string[] | string;
  Answer?: string;
};

export default function Index() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleDeepLink = React.useCallback(({ url }: { url: string }) => {
    if (url && url.includes('postman.com')) {
      fetchQuestionData(url);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription?.remove();
  }, [handleDeepLink]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setShowCamera(false);

    if (data.includes('postman.com') || data.includes('http')) {
      fetchQuestionData(data);
    } else {
      Alert.alert('Invalid QR Code', 'Please scan a valid scavenger hunt QR code');
      setScanned(false);
    }
  };

  const fetchQuestionData = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const data = await response.json();

      const answerUrl = 'https://570d48f7-91ae-415a-8502-441c37cc0760.mock.pstmn.io/answer';

      setQuestionData({ ...data, url: answerUrl, Answer: 'blue' });
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch question data.');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !questionData || !questionData.url) return;

    setLoading(true);
    try {
      const isCorrect = selectedAnswer.toLowerCase() === questionData.Answer?.toLowerCase();


      if (isCorrect) {

        Alert.alert('Correct!', 'Great job! You got it right!', [
          { text: 'Next Question', onPress: resetForNextQuestion }
        ]);
        setShowResult(true);
      } else {
        Alert.alert('Incorrect', 'Try again!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer.');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForNextQuestion = () => {
    setQuestionData(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setScanned(false);
  };

  const startScanning = () => {
    setShowCamera(true);
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'pdf417'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.scanText}>Point your camera at the QR code</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>🏃‍♂️ Scavenger Hunt</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {!questionData && !loading && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Ready to start your scavenger hunt adventure?
            </Text>
            <Text style={styles.instructionText}>
              Scan a QR code to get your first question!
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={startScanning}
            >
              <Text style={styles.buttonText}>📱 Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {questionData && !loading && (
          <View style={styles.questionContainer}>
            {questionData.img_src && (
              <View style={styles.imageContainer}>
                <Text style={styles.imageText}>🖼️ Image: {questionData.img_src}</Text>
              </View>
            )}
            <Text style={styles.question}>{questionData.question}</Text>

            {questionData.hint && (
              <Text style={styles.hint}>💡 Hint: {questionData.hint}</Text>
            )}

            {questionData.responseType === 'multipleChoice' &&
              questionData.choices && (
                <View style={styles.choicesContainer}>
                  {questionData.choices.map((choice, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.choiceButton,
                        selectedAnswer === choice && styles.selectedChoice
                      ]}
                      onPress={() => setSelectedAnswer(choice)}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          selectedAnswer === choice && styles.selectedChoiceText
                        ]}
                      >
                        {choice}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            {selectedAnswer && (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitAnswer}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </Text>
              </TouchableOpacity>
            )}

            {showResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>✅ Correct Answer!</Text>
                <Text style={styles.pointsText}>
                  Points: {questionData.pointsRewarded?.[0] || 10}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.newScanButton}
              onPress={startScanning}
            >
              <Text style={styles.buttonText}>📱 Scan Next QR Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2c3e50',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: '#34495e',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  scanButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  questionContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageContainer: {
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  imageText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  ageGroupContainer: {
    backgroundColor: '#e7f3ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  ageGroupText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#2c3e50',
    lineHeight: 28,
  },
  hint: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#f39c12',
    backgroundColor: '#fef9e7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  choicesContainer: {
    marginBottom: 20,
  },
  choiceButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  selectedChoice: {
    backgroundColor: '#e7f3ff',
    borderColor: '#007bff',
  },
  choiceText: {
    fontSize: 16,
    color: '#495057',
  },
  selectedChoiceText: {
    color: '#007bff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  newScanButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 5,
  },
  pointsText: {
    fontSize: 16,
    color: '#155724',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
