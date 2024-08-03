
import { addDoc, collection } from 'firebase/firestore';
import GuestForm from '../components/GuestForm';
import { db } from '../firebaseConfig';

const Home = () => {

    const addGuest = (values) => {
        addDoc(collection(db, 'guests'), values).then(() => {
            alert('Guest added successfully!');
            window.location.reload();
        })
    }

    return (
        <GuestForm addGuest={addGuest} />
    );
};

export default Home;
