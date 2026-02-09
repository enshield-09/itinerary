import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function OptionCard({ option, selectedOption }) {
    // Handle both single selection (object) and multi-selection (array)
    const isSelected = Array.isArray(selectedOption)
        ? selectedOption.some(item => item.id === option?.id)
        : selectedOption?.id === option?.id;

    return (
        <View style={[{
            padding: 20,
            backgroundColor: '#fff',
            borderRadius: 15,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 3,
            marginBottom: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        }, isSelected && {
            borderWidth: 2,
            borderColor: Colors.PRIMARY,
            backgroundColor: '#f0f7ff'
        }]}>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 18,
                    fontFamily: 'outfit-bold',
                    color: isSelected ? Colors.PRIMARY : Colors.BLACK
                }}>{option.title}</Text>
                <Text style={{
                    fontSize: 15,
                    fontFamily: 'outfit',
                    color: Colors.GRAY,
                    marginTop: 5
                }}>{option?.desc}</Text>
            </View>

            {/* Selection indicator */}
            {isSelected && (
                <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: Colors.PRIMARY,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 10
                }}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                </View>
            )}
        </View>
    )
}