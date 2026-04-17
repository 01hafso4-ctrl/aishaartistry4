import { useEffect } from 'react';
import { View, Text, Linking } from 'react-native';

export default function Book() {
  useEffect(() => {
    Linking.openURL(
      "https://www.fresha.com/book-now/aishaartistry4-fb058pbl/all-offer?share=true&pId=2853591"
    );
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Opening booking...</Text>
    </View>
  );
}
 
     
    
      
   
 
      

     
        
         
   
      
     
