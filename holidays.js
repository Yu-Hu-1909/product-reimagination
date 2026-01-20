// Firebase imports
import { db, currentUser } from './calendar.js';
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Indian Public Holidays 2026
const indianHolidays2026 = [
    { date: '2026-01-01', title: 'New Year\'s Day', description: 'First day of the year' },
    { date: '2026-01-14', title: 'Makar Sankranti / Pongal', description: 'Harvest festival celebrated across India' },
    { date: '2026-01-23', title: 'Parakram Divas / Vasant Panchami', description: 'Birth anniversary of Netaji Subhas Chandra Bose' },
    { date: '2026-01-26', title: 'Republic Day', description: 'National holiday celebrating the Constitution of India' },
    { date: '2026-03-04', title: 'Holi', description: 'Festival of colors' },
    { date: '2026-03-21', title: 'Eid-ul-Fitr', description: 'Festival marking the end of Ramadan (Tentative)' },
    { date: '2026-03-26', title: 'Ram Navami', description: 'Birth of Lord Rama' },
    { date: '2026-03-31', title: 'Mahavir Jayanti', description: 'Birth anniversary of Lord Mahavir' },
    { date: '2026-04-03', title: 'Good Friday', description: 'Crucifixion of Jesus Christ' },
    { date: '2026-04-14', title: 'Dr. Ambedkar Jayanti', description: 'Birth anniversary of Dr. B.R. Ambedkar' },
    { date: '2026-05-01', title: 'Buddha Purnima', description: 'Birth anniversary of Gautama Buddha' },
    { date: '2026-05-27', title: 'Eid al-Adha (Bakrid)', description: 'Festival of sacrifice (Tentative)' },
    { date: '2026-06-26', title: 'Muharram', description: 'Islamic New Year (Tentative)' },
    { date: '2026-08-15', title: 'Independence Day', description: 'National holiday celebrating India\'s independence' },
    { date: '2026-08-25', title: 'Eid-e-Milad', description: 'Birth of Prophet Muhammad (Tentative)' },
    { date: '2026-09-04', title: 'Janmashtami', description: 'Birth of Lord Krishna' },
    { date: '2026-10-02', title: 'Gandhi Jayanti', description: 'Birth anniversary of Mahatma Gandhi' },
    { date: '2026-10-20', title: 'Dussehra (Vijaya Dashami)', description: 'Victory of good over evil' },
    { date: '2026-11-08', title: 'Diwali (Deepavali)', description: 'Festival of lights' },
    { date: '2026-11-24', title: 'Guru Nanak Jayanti', description: 'Birth anniversary of Guru Nanak Dev' },
    { date: '2026-12-25', title: 'Christmas', description: 'Birth of Jesus Christ' }
];

// Automatically import holidays when calendar loads
async function autoImportHolidays() {
    try {
        // Check if holidays have already been imported for this user
        const userRef = doc(db, 'users', currentUser);
        const userDoc = await getDoc(userRef);
        
        // Always re-import holidays to fix old ones without categoryId
        // Delete old holidays first
        const eventsRef = collection(db, 'users', currentUser, 'events');
        const oldHolidaysQuery = query(eventsRef, where('isHoliday', '==', true));
        const oldHolidaysSnapshot = await getDocs(oldHolidaysQuery);
        
        // Delete old holidays
        const deletePromises = [];
        oldHolidaysSnapshot.forEach((docSnapshot) => {
            deletePromises.push(deleteDoc(doc(db, 'users', currentUser, 'events', docSnapshot.id)));
        });
        
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
            console.log(`Deleted ${deletePromises.length} old holiday entries`);
        }

        console.log('Auto-importing Indian holidays for user:', currentUser);
        let importedCount = 0;

        for (const holiday of indianHolidays2026) {
            // Create holiday event - time set to 12:00 AM (midnight)
            const eventData = {
                title: holiday.title,
                description: holiday.description,
                startDate: Timestamp.fromDate(new Date(holiday.date)),
                endDate: Timestamp.fromDate(new Date(holiday.date)),
                startTime: '00:00', // 12:00 AM
                endTime: '23:59',   // End of day
                categoryId: 'cat_holidays', // Official Holidays category
                categoryName: 'Official Holidays',
                color: '#d50000',   // Red color for holidays
                isHoliday: true,    // Flag to identify holidays
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const eventsCollection = collection(db, 'users', currentUser, 'events');
            await addDoc(eventsCollection, eventData);
            importedCount++;
        }

        // Mark holidays as imported for this user
        await setDoc(userRef, { 
            holidaysImported: true,
            holidaysImportedAt: serverTimestamp()
        }, { merge: true });

        console.log(`Successfully auto-imported ${importedCount} holidays with proper categories!`);

    } catch (error) {
        console.error('Error auto-importing holidays:', error);
        // Silently fail - don't disrupt user experience
    }
}

// Run auto-import when the module loads
if (currentUser) {
    autoImportHolidays();
}

export { indianHolidays2026, autoImportHolidays };
