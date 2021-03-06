import React, { useEffect, useState } from 'react';
// styling and background image
import { View, Text, StyleSheet, Dimensions, Platform, 
  TouchableOpacity, ImageBackground} from 'react-native';
// camera, icons, and permissions
import { Ionicons, Foundation } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// ResultsScreen navigation
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ResultsScreen from './ResultsScreen';

// Variables for buttons to disable them when loading screen is shown
let buttonOpacity = 1;
let buttonOff = false;

// function that returns ResultsScreen in a view
function Results() {
  return (
    <View>
      <ResultsScreen/>
    </View>
  );
}

// camera screen function
function cameraSnap({ navigation }) {
  // Variables related to camera permission and functions
  const [hasPermission, setHasPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [cameraType, setType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState("off");
  const [flashType, setFlashType] = useState("md-flash-off"); // For icon
  
  // Variables related to pictures 
  const [picTaken, setPicTaken] = useState(false);
  const [picUri, setPicUri] = useState(null);
  const [backUri, setBackUri] = useState(null);

  // Variables to get screen ratio for Android only
  const [ratio, setRatio] = useState('4:3');  // default is 4:3
  const { height, width } = Dimensions.get('window');
  const screenRatio = height / width;
  const [isRatioSet, setIsRatioSet] = useState(false);

  // On screen load, ask for permission to use the camera
  useEffect(() => {
    async function getCameraStatus() {
      const { status } = await Permissions.askAsync(Permissions.CAMERA);
      setHasPermission(status == 'granted');
    }
    getCameraStatus();
  }, []);

  // Set the best camera ratio (portrait mode only)
  const getRatio = async () => {
    // Start with the default ratio
    let bestRatio = '4:3';

    // Ratio is for Android only
    if (Platform.OS === 'android') {
      // Gets ratios supported by device
      const ratios = await camera.getSupportedRatiosAsync();

      let distances = {};
      let decimalRatios = {};
      let minDistance = null;

      // Goes through ratios and gets one closest to screen ratio
      // Uses distance from screenRatio to choose the best one
      for (const ratio of ratios) {
        const ratioParts = ratio.split(':');
        const decimalRatio = parseInt(ratioParts[0]) / parseInt(ratioParts[1]);
        decimalRatios[ratio] = decimalRatio;

        // Ratio can't be larger than the screen, so it grabs the closest
        // one that isn't bigger than the screen
        // Uses smallest distance from screenRatio to choose best one
        const distance = screenRatio - decimalRatio;
        distances[ratio] = decimalRatio;
        if (minDistance == null) {
          minDistance = ratio;
        } else {
          if (distance >= 0 && distance < distances[minDistance]) {
            minDistance = ratio;
          }
        }
      }
      // Set the best ratio
      bestRatio = minDistance;
      setRatio(bestRatio);

      // Flag set to calculate the ratio only once
      setIsRatioSet(true);
    }
  };

  // Camera needs to be open when getting the supported ratios
  const setCameraReady = async () => {
    if (!isRatioSet) {
      await getRatio();
    }
  };

  const takePicture = async () => {
    setBackUri(null);
    if (camera) {
      // Compresses less for android since only camera1 api is used
      // Camera1 api produces lower quality images than camera2 api
      // So Android images need less compression than higher quality iOS images
      if (Platform.OS === 'android') {
        // Quality option does compression for Android
        const options = { quality: 0.15, base64: true };
        let data = await camera.takePictureAsync(options);
        // Info printed to console
        console.log("Took picture");
        let fileInfo = await FileSystem.getInfoAsync(data.uri);
        console.log(fileInfo.size + " bytes");
        // Sets picture taken flag to true to show preview and sets image uri
        setPicTaken(true);
        setPicUri(data.uri);
        setBackUri(data.uri);

      } else {
        // Compression for iOS is done here, it compresses the image twice        
        const options = { quality: 0.01, base64: true };
        let data = await camera.takePictureAsync(options);
        // Info printed to the console
        console.log("Took picture");
        let fileInfo = await FileSystem.getInfoAsync(data.uri);
        console.log(fileInfo.size + " bytes");
        // Sets picture taken flag to true to show preview
        setPicTaken(true);
        // Second time image is compressed since iOS images are larger
        const data2 = await ImageManipulator.manipulateAsync(
          data.uri,
          [],
          { compress: 0.01}
        );
        // Info printed to console
        fileInfo = await FileSystem.getInfoAsync(data2.uri);
        console.log(fileInfo.size + " bytes");
        // Sets image uri
        setPicUri(data2.uri);
        setBackUri(data2.uri);

      }
    }
  };

  // Loads the ResultsScreen after a certain time
  const loadResultsScreen = async () => {
    setTimeout(
      () => { navigation.navigate("Results") },
      5000
    )
  };

  // Changes the background image to temporarily simulate an ad
  function loadingAd() {
    setBackUri("https://media2.giphy.com/media/l46CyJmS9KUbokzsI/giphy.gif");
  }

  // Currently handles the results loading process (will update when ready)
  function loadResults() {
    buttonOpacity = 0;
    buttonOff = true;
    
    loadingAd();
    loadResultsScreen();
    
    // Timers set to revert changes made to touchable opacities
    setTimeout(
      () => { setBackUri(picUri) },
      6000
    )
    setTimeout(
      () => { buttonOpacity = 1},
      1000
    )
    setTimeout(
      () => { buttonOff = false},
      1000
    )
    
  }

  // Main Functionality of function/screen is below
  // Checks for camera permissions to return views
  if (hasPermission === null) {
    return (
      <View style={{flex:1, flexDirection:"column"}}>
        <Text>Waiting for camera permissions.</Text>
      </View>
    );
  } else if (hasPermission === false) {
    return (
      <View style={{flex:1, flexDirection:"column"}}>
        <Text>No access to camera.</Text>
      </View>
    );
  // At this point camera permisson is granted
  // So it checks if a picture has been taken
  // If no picture has been taken, the camera screen is shown
  } else if (picTaken === false) { 
    return (
      <View style={{flex:1}}>
        <Camera
          style={{flex: 1}}
          onCameraReady={setCameraReady}
          type={cameraType}
          autoFocus={'on'}
          flashMode={flash}
          ratio={ratio}
          // ref set to "camera" 
          ref={(ref) => {
            setCamera(ref);
          }}>
          <View // View for icons used by camera screen
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              flexDirection: 'row',
            }}>

            <TouchableOpacity // Button to flip cameras
              style={[ styles.icons, styles.touchables, {flex: 0.2,}]}
              onPress={() => {
                // Flips cameras 
                setType(
                  cameraType === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                )
              }}>
              <Ionicons // Icon for camera flipping button
                        name="md-reverse-camera"
                        color="white"
                        size={50}
                    />
            </TouchableOpacity>

            <TouchableOpacity // Empty space so icon buttons work properly
            style={[styles.touchables, {flex: 0.5,}]}>
            </TouchableOpacity>

            <TouchableOpacity // Button to take pictures
              style={[styles.icons, styles.touchables, {flex: 0.2,}]}
              onPress={() => takePicture()
              }>
              <Ionicons // Icon for picture taking button
                        name="md-camera"
                        color="white"
                        size={50}
                    />
            </TouchableOpacity>
            
            <TouchableOpacity // Empty space so icon buttons work properly
            style={[styles.touchables, {flex: 0.4,}]}>
            </TouchableOpacity>

            <TouchableOpacity // Button for flash
              style={[styles.icons, styles.touchables, 
                     {flex: 0.2, paddingRight: 8,}]
                    }
              onPress={() => {
                // Sets flash to on or off
                setFlash(
                  flash === "off"
                    ? "on"
                    : "off"
                );
                // Sets flash button to on or off button icon
                setFlashType(
                  flashType === "md-flash-off"
                    ? "md-flash"
                    : "md-flash-off"
                );
              }}>
              <Ionicons // Icon for flash 
                        name={flashType}
                        color="white"
                        size={50}
                    />
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    );
  // Shows image preview if one was taken
  // Also shows results page when ready
} else { 
    return (
      <View style={{flex:1}}>
        <ImageBackground
          style={{
            flex: 1,
            resizeMode: 'cover',
            justifyContent: 'center'
          }}
          source={{
            uri: backUri,
          }}
        >
          <View // View for image retake option 
          style={{flex: 1, flexDirection: "row"}}>
           
            <TouchableOpacity // Empty space so icon buttons work properly
            style={[styles.touchables, {flex: 0.1,}]}>
            </TouchableOpacity> 

            <TouchableOpacity // Icon & text both work to retake image
              style={[styles.touchables, {flex: 0.4, alignItems: "center",}]}
              disabled = {buttonOff}
              onPress={() => setPicTaken(false)
              }>
                <Ionicons // Icon for camera flipping button
                        style={{opacity: buttonOpacity,}}
                        name="md-reverse-camera"
                        color="white"
                        size={50}
                    />
                <Text style={{color: "white", fontSize: 24, textAlign: "center", opacity: buttonOpacity,}}>
                  Retake picture
                </Text>
            </TouchableOpacity>
          
            <TouchableOpacity // Empty space so icon buttons work properly
            style={[styles.touchables, {flex: 0.1,}]}>
            </TouchableOpacity>  

            <TouchableOpacity // Icon & text both work to load results
              style={[styles.touchables, {flex: 0.4, alignItems: "center",}]}
              disabled = {buttonOff}
              onPress={() => loadResults()
              }>
                <Foundation 
                        style={{opacity: buttonOpacity,}}
                        name="results"
                        color="white"
                        size={50} 
                    />
                <Text style={{color: "white", fontSize: 24, textAlign: "center", opacity: buttonOpacity,}}>
                  Results
                </Text>
            </TouchableOpacity>

          </View>
        </ImageBackground>
      </View>
    );
  }
}

// Stylesheet for touchable opacities
const styles = StyleSheet.create({
  icons: {
    paddingLeft: 12,
    paddingRight: 15,
    paddingBottom: 10,
    paddingTop: 10,
  },
  touchables: {
    alignSelf: 'flex-end',
    backgroundColor: 'transparent',
  },
});


// Below area is what makes the possible screens for tab
const Stack = createStackNavigator();

function snapCamera() {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator initialRouteName="Camera">
        <Stack.Screen name="Camera" component={cameraSnap} />
        <Stack.Screen name="Results" component={Results} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default snapCamera;