import { Container, Title, Text, AppShell, ScrollArea, NavLink, Tabs, Button, Divider, ActionIcon, Grid, Collapse, Tooltip, Flex, Center, CloseButton, Paper, ThemeIcon } from '@mantine/core';
import { useParams, Link } from 'react-router-dom';
import { doc, collection, addDoc, query, where, updateDoc, orderBy, getDoc, deleteDoc } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebaseConfig';
import { LoadingOverlay } from '@mantine/core';
import { IconX, IconCheck, IconRestore, IconHeartHandshake } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { Empty, Image } from 'antd';
import RecommendedGuestCard from '../components/RecommendedGuestCard';
import PropTypes from 'prop-types'
import { notifications } from '@mantine/notifications';
// import { ImageBox } from 'mantine-addons';



const GuestDetail = ({ toggle }) => {
    const { id } = useParams();
    const [guestDoc, loadingGuest, errorGuest] = useDocument(doc(db, 'guests', id));
    const [guestsCollection, loadingGuests, errorGuests] = useCollection(collection(db, 'guests'), orderBy('matched', 'desc'));

    const [opened, { toggle: toggleOpened }] = useDisclosure(false);
    const [opened2, { toggle: toggleOpened2 }] = useDisclosure(false);

    const blindDatesQuery = query(collection(db, 'blind_dates'), where('guestId', '==', id));
    const [blindDatesSnapshot, loadingBlindDates, errorBlindDates] = useCollection(blindDatesQuery);

    if (loadingGuest || loadingGuests || loadingBlindDates) return <LoadingOverlay visible />;
    if (errorGuest || errorGuests || errorBlindDates) return <div>Error: {errorGuest?.message || errorGuests?.message || errorBlindDates?.message}</div>;

    const guest = guestDoc?.data();
    const guests = guestsCollection?.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const blindDates = blindDatesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    const handleStatusChange = async (dateId, status, chosenUserId) => {
        try {
            const dateDocRef = doc(db, 'blind_dates', dateId);
            const userInfo = doc(db, 'guests', id);
            const chosenUser = doc(db, 'guests', chosenUserId);
            const successfulUser = doc(db, 'guests', chosenUserId);
            const successfullUserDoc = getDoc(successfulUser);
            const successfullUserData = await successfullUserDoc;
            await updateDoc(dateDocRef, { status }).then(async () => {
                if (status === 'successful') {

                    await addDoc(collection(db, 'successful'), {
                        userOne: successfullUserData.data(),
                        userTwo: guest
                    }).then(async (res) => {
                        await updateDoc(userInfo, { matched: true, status, successId: res.id, matchedUser: successfullUserData.data(), matchedUserId: chosenUserId }).then(async () => {
                            await updateDoc(chosenUser, { matched: true, status, successId: res.id, matchedUser: guest, matchedUserId: id }).then(() => {
                                notifications.show(
                                    { title: 'Success', message: `Blind date marked as ${status}!`, color: 'green' }
                                )
                            })
                        })

                    })
                } else if (status === 'pending' || status === 'unsuccessful') {
                    if (guest.successId) {
                        deleteDoc(doc(db, 'successful', guest.successId)).then(async () => {
                            await updateDoc(userInfo, { matched: false, status, successId: '', matchedUser: '', matchedUserId: '' }).then(async () => {
                                await updateDoc(chosenUser, { matched: false, status, successId: '', matchedUser: '', matchedUserId: '' }).then(() => {
                                    notifications.show(
                                        { title: 'Success', message: `Blind date marked as ${status}!`, color: 'blue' }
                                    )
                                }).catch((error) => {
                                    console.error(`Error updating blind date status: `, error);
                                })
                            }).catch((error) => {
                                console.error(`Error updating blind date status: `, error);
                            })
                        }).catch((error) => {
                            console.error(`Error updating blind date status: `, error);
                        })
                    } else {
                        await updateDoc(userInfo, { matched: false, status, successId: '', matchedUser: '', matchedUserId: '' }).then(async () => {
                            await updateDoc(chosenUser, { matched: false, status, successId: '', matchedUser: '', matchedUserId: '' }).then(() => {
                                notifications.show(
                                    { title: 'Success', message: `Blind date marked as ${status}!`, color: 'blue' }
                                )
                            }).catch((error) => {
                                console.error(`Error updating blind date status: `, error);
                            })
                        }).catch((error) => {
                            console.error(`Error updating blind date status: `, error);
                        })
                    }
                }

            })
        } catch (error) {
            console.error(`Error updating blind date status: `, error);
            notifications.show(
                { title: 'Error', message: `Error updating blind date status: ${error.message}`, color: 'red' }
            )
        }
    };

    const setBlindDate = async (recommendedGuestId) => {
        const existingDate = blindDates.find(date => date.recommendedGuestId === recommendedGuestId);
        if (existingDate) {
            alert('This person is already in your Blind Date list.');
            return;
        }

        try {
            await addDoc(collection(db, 'blind_dates'), {
                guestId: id,
                recommendedGuestId,
                dateSet: new Date(),
                status: 'pending',
            });
            alert('Added to Blind date list successfully!');
        } catch (error) {
            console.error('Error adding to blind date list: ', error);
            alert('Failed to add to blind date list.');
        }
    };

    const recommendedGuests = guests.filter(g =>
        g.gender === guest?.interestedIn &&
        (!guest.match || guest.match === false) &&
        g.gender !== guest?.gender &&
        (
            (guest.preferredLocation ? g.location === guest.preferredLocation : true) ||
            (
                (guest.preferredReligion ? g.religion === guest.preferredReligion : true) ||
                (guest.preferredZodiacSign ? g.zodiacSign === guest.preferredZodiacSign : true) ||
                (guest.preferredPersonality ? g.personality === guest.preferredPersonality : true) ||
                guest.preference.split(' ').some(pref => g.description?.toLowerCase().includes(pref.toLowerCase()))
            )
        ) &&
        (guest.dontMindKids || g.haveKids === guest.haveKids) &&
        g.id !== id
    );

    const getMatchPercentage = (user) => {
        let matchScore = 0;
        let totalWeight = 0;

        const weights = {
            gender: 20,
            location: 10,
            religion: 10,
            zodiacSign: 10,
            personality: 20,
            description: 20,
            kids: 10,
            age: 10,
        };

        if (guest.gender === user.gender) matchScore += weights.gender;
        if (guest.preferredLocation === user.location) matchScore += weights.location;
        if (guest.preferredReligion === user.religion) matchScore += weights.religion;
        if (guest.preferredZodiacSign === user.zodiacSign) matchScore += weights.zodiacSign;
        if (guest.preferredPersonality === user.personality) matchScore += weights.personality;
        if ((guest.age >= user.minimumPreferredAgeRange && guest.age <= user.maximumPreferredAgeRange) || guest.age >= user.age - 3 || guest.age <= user.age + 3) matchScore += weights.age;
        if (guest.preference.split(' ').some(pref => user.description?.toLowerCase().includes(pref.toLowerCase()))) matchScore += weights.description;
        if (!guest.dontMindKids && user.haveKids === guest.haveKids) matchScore += weights.kids;

        totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

        return (matchScore / totalWeight) * 100;
    };


    if (!guest) return <Center mt={70}>
        <Empty description="No guest found" />
    </Center>


    return (
        <>
            <AppShell.Aside p="md">
                <ScrollArea h={'auto'}>
                    <CloseButton onClick={() => toggle()} hiddenFrom='sm' />
                    {guests.map((g, i) => (
                        <NavLink
                            key={g.id}
                            component={Link}
                            to={`/submissions/${g.id}`}
                            label={<Flex align={'center'} gap={10}>
                                <Text>
                                    {i + 1}.
                                </Text>
                                <Text>
                                    {g.name}
                                </Text>
                            </Flex>}
                            active={g.id === id}
                            variant="filled"
                            bg={(g.matched && g.id !== id) ? 'rgb(108, 192, 60, 0.7' : ''}
                            onClick={() => toggle()}
                            style={{ marginBottom: '8px' }}
                        />
                    ))}
                </ScrollArea>
            </AppShell.Aside>

            <AppShell.Main>
                <Container mt={'xl'}>

                    <Tabs mt="lg" defaultValue="details" variant='outline'>
                        <Tabs.List>
                            <Tabs.Tab value="details">User Details</Tabs.Tab>
                            <Tabs.Tab value="recommends"> Match </Tabs.Tab>

                        </Tabs.List>

                        <Tabs.Panel value="details">
                            <Flex align={'center'} justify={'center'} direction={'row'} mt={20}>
                                {/* {console.log(guest.matchedUser)} */}

                                {/* <ImageBox src={guest.image} alt="Placeholder image" /> */}
                                <Container>
                                    <Image
                                        width={80}
                                        height={80}
                                        src={guest.image ? guest.image : "error"}
                                        fallback="data:image/png;base64,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"
                                    />
                                    <Title order={5}>{guest?.name}</Title>
                                </Container>

                                <Container>
                                    <ThemeIcon color="red" variant="light">
                                        <IconHeartHandshake />
                                    </ThemeIcon>
                                </Container>

                                <Container>
                                    <Image
                                        width={80}
                                        height={80}
                                        src={guest?.matchedUser?.image}
                                        fallback="data:image/png;base64,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"
                                    />
                                    <Title order={5}>{guest?.matchedUser?.name}</Title>
                                </Container>

                            </Flex>
                            {
                                guest?.status === 'successful' && <Paper bg={'#e9f3ff'} style={{ textAlign: 'center' }} mt={'lg'}>
                                    <NavLink component={Link} color='blue' to={`/submissions/${guest?.matchedUserId}`} w={'auto'} label="View matched profile" />
                                </Paper>
                            }

                            <Divider my="sm" />
                            <Button onClick={toggleOpened}>User Details</Button>

                            <Collapse in={opened} p={'lg'}>
                                <Text><strong>Name:</strong> {guest?.name}</Text>
                                <Text><strong>Slack Display Name:</strong> {guest?.slackDisplayName}</Text>
                                <Text><strong>Email:</strong> {guest?.email}</Text>
                                <Text><strong>Gender:</strong> {guest?.gender}</Text>
                                <Text><strong>Age:</strong> {guest?.age}</Text>
                                <Text><strong>Height:</strong> {guest?.height} cm</Text>
                                <Text><strong>Profession:</strong> {guest?.profession}</Text>
                                <Text><strong>Religion:</strong> {guest?.religion}</Text>
                                <Text><strong>Employment Status:</strong> {guest?.employmentStatus}</Text>
                                <Text><strong>Genotype:</strong> {guest?.genotype}</Text>
                                <Text><strong>Have Kids:</strong> {guest?.haveKids ? 'Yes' : 'No'}</Text>
                                <Text><strong>Location:</strong> {guest?.location}</Text>
                                <Text><strong>Dating Status:</strong> {guest?.datingStatus}</Text>
                                <Text><strong>Zodiac Sign:</strong> {guest?.zodiacSign}</Text>
                                <Text><strong>Personality:</strong> {guest?.personality}</Text>
                                <Text><strong>Description:</strong> {guest?.description}</Text>
                                <Text><strong>Do You Mind if the Other Person Has Kids:</strong> {guest?.dontMindKids ? 'Yes, I do mind' : 'No, I don\'t care'}</Text>
                            </Collapse>

                            <Title order={3} mt="lg">Partner Preferences</Title>
                            <Divider my="sm" />

                            <Button onClick={toggleOpened2}>Partner Preferences</Button>

                            <Collapse in={opened2} p={'lg'}>
                                <Text><strong>Preferred Gender:</strong> {guest?.interestedIn}</Text>
                                <Text><strong>Preferred Location:</strong> {guest?.preferredLocation}</Text>
                                <Text><strong>Preferred Religion:</strong> {guest?.preferredReligion}</Text>
                                <Text><strong>Preferred Zodiac Sign:</strong> {guest?.preferredZodiacSign}</Text>
                                <Text><strong>Preferred Personality:</strong> {guest?.preferredPersonality}</Text>
                                <Text><strong>Preferred Dating Status:</strong> {guest?.preferredDatingStatus}</Text>
                                <Text><strong>Do You Mind if the Other Person Has Kids:</strong> {guest?.dontMindKids ? 'Yes, I do mind' : 'No, I don\'t care'}</Text>
                                <Text><strong>Partner Preferences:</strong> {guest?.preference}</Text>
                                <Text><strong>Preferred Age Range:</strong><br /> min: <strong>{guest?.minimumPreferredAgeRange}</strong> max: <strong>{guest?.maximumPreferredAgeRange}</strong> </Text>
                            </Collapse>
                        </Tabs.Panel>
                        <Tabs.Panel value="recommends">
                            <Tabs mt="lg" defaultValue="recommendations">
                                <Tabs.List>
                                    <Tabs.Tab value="recommendations">Recommendations</Tabs.Tab>
                                    <Tabs.Tab value="blind-date">Blind Date</Tabs.Tab>
                                    <Tabs.Tab value="successful">Successful</Tabs.Tab>
                                    <Tabs.Tab value="unsuccessful">Unsuccessful</Tabs.Tab>
                                </Tabs.List>

                                <Tabs.Panel value="recommendations">
                                    <Title order={3} my="lg">Recommended Matches</Title>
                                    <Divider my="sm" />

                                    <ScrollArea h={550} p={20}>
                                        {recommendedGuests.length > 0 ? (
                                            recommendedGuests
                                                .map((rec) => {
                                                    rec.matchPercentage = getMatchPercentage(rec);
                                                    return rec;
                                                })
                                                .sort((a, b) => b.matchPercentage - a.matchPercentage)
                                                .map((rec) => {
                                                    const isAlreadyInBlindDate = blindDates.some(date => date.recommendedGuestId === rec.id);
                                                    // const isAlreadyInADateWithAnotherGuest = rec.some(date => date.status === 'pending');
                                                    // console.log(rec)

                                                    return (
                                                        <RecommendedGuestCard
                                                            key={rec.id}
                                                            guest={rec}
                                                            setBlindDate={setBlindDate}
                                                            isAlreadyInBlindDate={isAlreadyInBlindDate}
                                                            matchPercentage={rec.matchPercentage}
                                                        // isAlreadyInADateWithAnotherGuest={isAlreadyInADateWithAnotherGuest}
                                                        />
                                                    );
                                                })
                                        ) : (
                                            <Empty description={"No recommendations found based on your preferences."} />
                                        )}

                                    </ScrollArea>


                                </Tabs.Panel>

                                <Tabs.Panel value="blind-date">
                                    <Title order={3} my="lg">Blind Date List</Title>
                                    <Divider my="sm" />
                                    <Grid>
                                        {blindDates.filter(date => date.status === 'pending').length > 0 ? (
                                            blindDates.filter(date => date.status === 'pending').map((date) => (
                                                <Container fluid key={date.id} bg={'#e9f1fe'} my={10} p={15} style={{ border: '1px solid #ddd', width: '100%' }}>
                                                    <Grid align="center" justify="space-between">
                                                        <Grid.Col span={10}>
                                                            <Text>
                                                                Blind date with {guests.find(g => g.id === date.recommendedGuestId)?.name}
                                                            </Text>
                                                        </Grid.Col>
                                                        <Grid.Col span={1}>
                                                            <Tooltip label="Successful Blind Date">
                                                                <ActionIcon color="green" onClick={() => handleStatusChange(date.id, 'successful', date.recommendedGuestId)}>
                                                                    <IconCheck size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Grid.Col>
                                                        <Grid.Col span={1}>
                                                            <Tooltip label="Unsuccessful Blind Date">
                                                                <ActionIcon color="red" variant='light' onClick={() => handleStatusChange(date.id, 'unsuccessful', date.recommendedGuestId)}>
                                                                    <IconX size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Grid.Col>
                                                    </Grid>
                                                </Container>
                                            ))
                                        ) : (
                                            <Center w={'100%'} p={10} >
                                                <Empty description={"No blind dates added."} />
                                            </Center>
                                        )}
                                    </Grid>
                                </Tabs.Panel>

                                <Tabs.Panel value="successful">
                                    <Title order={3} my="lg">Successful Blind Dates</Title>
                                    <Divider my="sm" />
                                    <Grid>
                                        {blindDates.filter(date => date.status === 'successful').length > 0 ? (
                                            blindDates.filter(date => date.status === 'successful').map((date) => (
                                                <Container fluid key={date.id} bg={'#e9f1fe'} my={10} p={15} style={{ border: '1px solid #ddd', width: '100%' }}>
                                                    <Grid align="center" justify="space-between">
                                                        <Grid.Col span={10}>
                                                            <Text>
                                                                Blind date with {guests.find(g => g.id === date.recommendedGuestId)?.name}
                                                            </Text>
                                                        </Grid.Col>
                                                        <Grid.Col span={1}>
                                                            <Tooltip label="Undo Successful Blind Date">
                                                                <ActionIcon color="green" onClick={() => handleStatusChange(date.id, 'pending', date.recommendedGuestId)}>
                                                                    <IconRestore size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Grid.Col>
                                                        <Grid.Col span={1}>
                                                            <Tooltip label="Unsuccessful Blind Date">
                                                                <ActionIcon color="red" variant='light' onClick={() => handleStatusChange(date.id, 'unsuccessful', date.recommendedGuestId)}>
                                                                    <IconX size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Grid.Col>
                                                    </Grid>
                                                </Container>
                                            ))
                                        ) : (
                                            <Center w={'100%'} p={10} >
                                                <Empty description={"No successful blind dates"} />
                                            </Center>
                                        )}
                                    </Grid>
                                </Tabs.Panel>

                                <Tabs.Panel value="unsuccessful">
                                    <Title order={3} my="lg">Unsuccessful Blind Dates</Title>
                                    <Divider my="sm" />
                                    <Grid>
                                        {blindDates.filter(date => date.status === 'unsuccessful').length > 0 ? (
                                            blindDates.filter(date => date.status === 'unsuccessful').map((date) => (
                                                <Container fluid key={date.id} bg={'#e9f1fe'} my={10} p={15} style={{ border: '1px solid #ddd', width: '100%' }}>
                                                    <Grid align="center" justify="space-between">
                                                        <Grid.Col span={10}>
                                                            <Text>
                                                                Blind date with {guests.find(g => g.id === date.recommendedGuestId)?.name}
                                                            </Text>
                                                        </Grid.Col>
                                                        <Grid.Col span={1}>
                                                            <Tooltip label="Undo Successful Blind Date">
                                                                <ActionIcon color="green" onClick={() => handleStatusChange(date.id, 'pending', date.recommendedGuestId)}>
                                                                    <IconRestore size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Grid.Col>
                                                        <Grid.Col span={1}>
                                                            <Tooltip label="Successful Blind Date.">
                                                                <ActionIcon color="green" variant='light' onClick={() => handleStatusChange(date.id, 'successful', date.recommendedGuestId)}>
                                                                    <IconCheck size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Grid.Col>
                                                    </Grid>
                                                </Container>
                                            ))
                                        ) : (
                                            <Center w={'100%'} p={10} >
                                                <Empty description={"No unsuccessful blind dates."} />
                                            </Center>
                                        )}
                                    </Grid>
                                </Tabs.Panel>
                            </Tabs>
                        </Tabs.Panel>
                    </Tabs>


                </Container>
            </AppShell.Main>
        </>
    );
};

GuestDetail.propTypes = {
    toggle: PropTypes.func
}

export default GuestDetail;
