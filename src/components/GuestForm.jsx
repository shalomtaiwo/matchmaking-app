
import { useForm } from '@mantine/form';
import { TextInput, Textarea, Button, Container, Title, Select, NumberInput, Checkbox, Divider, SimpleGrid, Paper, Image } from '@mantine/core';
import { useState } from 'react';
import { UploadImage } from '../uploads/UploadImage';
import ImageUpload from '../assets/upload.svg';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types'

const getRandomUserDetails = () => {
    const randomNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis'];
    const randomAges = [22, 25, 30, 35, 40];
    const randomHeights = [160, 165, 170, 175, 180];
    const randomReligions = ['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Atheism'];
    const randomEmploymentStatuses = ['Employed', 'Self-employed', 'Business owner'];
    const randomProfessions = ['Developer', 'Designer', 'Marketer', 'Data Scientist', 'Manager'];
    const randomGenotypes = ['AA', 'AS', 'SS'];
    const randomLocations = ['New York, USA', 'Los Angeles, USA', 'London, UK', 'Berlin, Germany', 'Tokyo, Japan'];
    const randomZodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const randomPersonalities = ['Introvert', 'Extrovert', 'Ambivert'];
    const randomPreferences = ['Caring', 'Adventurous', 'Intelligent', 'Creative', 'Humble'];

    return {
        name: randomNames[Math.floor(Math.random() * randomNames.length)],
        age: randomAges[Math.floor(Math.random() * randomAges.length)],
        height: randomHeights[Math.floor(Math.random() * randomHeights.length)],
        religion: randomReligions[Math.floor(Math.random() * randomReligions.length)],
        employmentStatus: randomEmploymentStatuses[Math.floor(Math.random() * randomEmploymentStatuses.length)],
        profession: randomProfessions[Math.floor(Math.random() * randomProfessions.length)],
        genotype: randomGenotypes[Math.floor(Math.random() * randomGenotypes.length)],
        haveKids: Math.random() > 0.5,
        gender: 'Man', // or 'Woman' based on your form
        location: randomLocations[Math.floor(Math.random() * randomLocations.length)],
        datingStatus: 'None of the above',
        zodiacSign: randomZodiacSigns[Math.floor(Math.random() * randomZodiacSigns.length)],
        personality: randomPersonalities[Math.floor(Math.random() * randomPersonalities.length)],
        interestedIn: 'Woman', // or 'Man' based on your form
        preferredLocation: randomLocations[Math.floor(Math.random() * randomLocations.length)],
        preferredZodiacSign: randomZodiacSigns[Math.floor(Math.random() * randomZodiacSigns.length)],
        preferredPersonality: randomPersonalities[Math.floor(Math.random() * randomPersonalities.length)],
        preference: randomPreferences[Math.floor(Math.random() * randomPreferences.length)],
        preferredDatingStatus: 'None of the above',
        preferredReligion: randomReligions[Math.floor(Math.random() * randomReligions.length)],
        dontMindKids: Math.random() > 0.5,
        slackDisplayName: 'Slack User', // Added Slack Display Name
        email: 'user@example.com', // Added Email
    };
};

const GuestForm = ({ addGuest }) => {
    const form = useForm({
        initialValues: {
            name: '',
            age: '',
            height: '',
            religion: '',
            employmentStatus: '',
            profession: '',
            genotype: '',
            haveKids: false,
            gender: '',
            location: '',
            datingStatus: '',
            zodiacSign: '',
            personality: '',
            description: '',
            interestedIn: '',
            preferredLocation: '',
            preferredZodiacSign: '',
            preferredPersonality: '',
            preference: '',
            preferredDatingStatus: '',
            preferredReligion: '',
            dontMindKids: false,
            slackDisplayName: '',
            email: '',
            image: '',
            minimumPreferredAgeRange: 0,
            maximumPreferredAgeRange: 0
        },
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = (values) => {
        setLoading(true);
        if (values.image) {
            addGuest(values)
            setTimeout(() => {
                notifications.show({
                    title: 'Success',
                    message: 'Submission added successfully',
                    color: 'green',
                    autoClose: 2000
                })
            }, 2000);
            setTimeout(() => {
                form.reset();
                window.location.reload();
                setLoading(false);
            }, 3000);
        }else{
            notifications.show({
                title: 'Error',
                message: 'Please upload an image',
                color: 'red',
                autoClose: 2000
            })
            setLoading(false);
        }
    };

    /* eslint-disable-next-line no-unused-vars */
    const fillDemoData = () => {
        const demoData = getRandomUserDetails();
        form.setValues(demoData);
    };

    const handleSubmitImage = (image) => {
        const newImage = image[0].src;
        form.setFieldValue('image', newImage);
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <Container mt={40} pb={80}>
            <Title order={2} my={35} ta={'center'}>Match making Submission Form</Title>
            <Divider my="sm" />
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Title order={4} mt="md">Personal Details</Title>
                <Divider my="sm" />

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 2 }}>
                    <Paper my={25}>

                        <UploadImage handleSubmitImage={handleSubmitImage} color='blue' multiple={false} variant='light' loading={loading}>
                            <Image h={160} fit="contain" w="auto" src={form?.values?.image} alt="Profile Picture" radius="lg" fallbackSrc={ImageUpload} />
                        </UploadImage>
                    </Paper>
                    <Paper my={25}>
                    </Paper>
                    <div>
                        <TextInput label="Name" {...form.getInputProps('name')} required />
                    </div>
                    <div>
                        <TextInput label="Slack Display Name" {...form.getInputProps('slackDisplayName')} required /> {/* New Field */}
                    </div>
                    <div>
                        <NumberInput label="Age" {...form.getInputProps('age')} required />
                    </div>
                    <div>
                        <TextInput label="Email" {...form.getInputProps('email')} required /> {/* New Field */}
                    </div>
                    <div>
                        <TextInput label="Height (cm)" {...form.getInputProps('height')} required />
                    </div>
                    <div>
                        <Select
                            label="Religion"
                            data={['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Atheism']}
                            {...form.getInputProps('religion')}
                        />
                    </div>
                    <div>
                        <Select
                            label="Employment Status"
                            data={['Employed', 'Self-employed', 'Business owner', 'Unemployed', 'Student']}
                            {...form.getInputProps('employmentStatus')}
                            required
                        />
                    </div>
                    <div>
                        <TextInput label="Tech Stack" {...form.getInputProps('profession')} required />
                    </div>
                    <div>
                        <TextInput label="Genotype" {...form.getInputProps('genotype')} />
                    </div>

                    <div>
                        <Select label="Your Gender" data={['Man', 'Woman']} {...form.getInputProps('gender')} required />
                    </div>
                    <div>
                        <TextInput label="Your Location" {...form.getInputProps('location')} required />
                    </div>
                    <div>
                        <Select
                            label="Your Dating Status"
                            data={['Currently in a relationship', 'Somebody is in a relationship with me', 'None of the above']}
                            {...form.getInputProps('datingStatus')}
                        />
                    </div>
                    <div>
                        <Select
                            label="Your Zodiac Sign"
                            data={['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']}
                            {...form.getInputProps('zodiacSign')}
                        />
                    </div>
                    <div>
                        <Select label="Your Personality" data={['Introvert', 'Extrovert', 'Ambivert']} {...form.getInputProps('personality')} />
                    </div>

                </SimpleGrid>
                <div>
                    <Checkbox my="md" label="Have Kids?" {...form.getInputProps('haveKids', { type: 'checkbox' })} />
                </div>
                <div>
                    <Textarea label="Describe Yourself" {...form.getInputProps('description')} required />
                </div>
                <Divider my="xl" />
                <Title order={4} mt="md">Preferences</Title>
                <Divider my="sm" />
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 2 }}>
                    <div>
                        <Select label="Preferred Gender" data={['Man', 'Woman']} {...form.getInputProps('interestedIn')} required />
                    </div>
                    <div>
                        <TextInput label="Preferred Location" {...form.getInputProps('preferredLocation')} />
                    </div>
                    <div>
                        <Select
                            label="Preferred Religion"
                            data={['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Atheism']}
                            {...form.getInputProps('preferredReligion')}
                        />
                    </div>
                    <div>
                        <Select
                            label="Preferred Zodiac Sign"
                            data={['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']}
                            {...form.getInputProps('preferredZodiacSign')}
                        />
                    </div>
                    <div>
                        <Select label="Preferred Personality" data={['Introvert', 'Extrovert', 'Ambivert']} {...form.getInputProps('preferredPersonality')} />
                    </div>
                    <div>
                        <Select
                            label="Preferred Dating Status"
                            data={['Currently in a relationship', 'Somebody is in a relationship with me', 'None of the above']}
                            {...form.getInputProps('preferredDatingStatus')}
                        />
                    </div>
                    <div>
                        <NumberInput
                            label="Minimum Age Range"
                            description="Please add maximum age first"
                            min={16}
                            max={form.values.maximumPreferredAgeRange}
                            step={1}
                            required
                            {...form.getInputProps('minimumPreferredAgeRange')}
                        />
                    </div>

                    <div>
                        <NumberInput
                            label="Maximum Age Range"
                            description="Minimum age must be less than maximum age"
                            min={form.values.minimumPreferredAgeRange}
                            max={100}
                            step={1}
                            required
                            {...form.getInputProps('maximumPreferredAgeRange')}
                        />
                    </div>

                </SimpleGrid>
                <div>
                    <Checkbox
                        label="Don't mind if the other person has kids"
                        {...form.getInputProps('dontMindKids', { type: 'checkbox' })}
                        my={'md'}
                    />
                </div>
                <div>
                    <Textarea label="What are you looking for in a partner?" {...form.getInputProps('preference')} required />
                </div>
                <Button type="submit" mt="md" loading={loading}>Submit</Button>
                {/* <Button type="button" mt="sm" ml="sm" onClick={fillDemoData} variant="outline">Fill Demo Data</Button> */}
            </form>
        </Container>
    );
};

GuestForm.propTypes = {
    addGuest: PropTypes.func
}

export default GuestForm;
