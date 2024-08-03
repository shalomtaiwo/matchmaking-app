import React from "react";
import {
    FileButton,
    Button,
    Modal,
    Image as MyImage,
    SimpleGrid,
    ScrollArea,
} from "@mantine/core";
import axios from "axios";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./getCroppedImg";
import { useDisclosure } from "@mantine/hooks";
import { IconPhoto } from "@tabler/icons-react";

export function UploadImage({
    children,
    handleSubmitImage,
    multiple,
    left,
    x = 2,
    y = 2,
    color = "gray",
    variant = "light",
    size,
    loading
}) {
    const [images, setImages] = React.useState([]);
    const [opened, { open, close }] = useDisclosure(false);
    const resetRef = React.useRef(null);

    const [isLoading, setIsLoading] = React.useState(false);
    const [isCrop, setIsCrop] = React.useState(false);
    const [defaultFile, setDefaultFile] = React.useState("");

    const [crop, setCrop] = React.useState({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [croppedImage, setCroppedImage] = React.useState("");
    const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);

    const onCropComplete = React.useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleChange = (e) => {
        const getImg = [];
        getImg.push(e);
        setImages(getImg);
        open();
    };

    const onCrop = async (file) => {
        setIsCrop(true);
        let src = file[0].url;
        setDefaultFile(file);

        if (!src) {
            src = await new Promise((resolve) => {
                const reader = new FileReader();
                if (file) {
                    reader.readAsDataURL(file[0]);
                }
                reader.onload = () => resolve(reader.result);
            });
        }
        const newImage = new Image();
        newImage.src = src;
        setCroppedImage(newImage.src);
    };

    const cropImage = async () => {
        try {
            const { url } = await getCroppedImg(croppedImage, croppedAreaPixels);
            onUpload(url);
        } catch (error) {
            // console.log(error)
        }
    };

    // Convert cropped image
    const onUpload = async (file) => {
        const reader = new FileReader();
        (async () => {
            const response = await fetch(file);
            const imageBlob = await response.blob();
            reader.readAsDataURL(imageBlob);
        })();
        reader.onloadend = () => {
            const base64data = reader.result;
            blobToBase64(base64data);
        };
    };

    const blobToBase64 = (cropped) => {
        const hubImages = [];
        (async () => {
            for (var i = 0; i < defaultFile.length; i++) {
                hubImages.push({
                    src: cropped,
                    name: defaultFile[i].name,
                });
                cloudUpload(hubImages);
            }
        })();
    };

    const previews = images?.map((file, index) => {
        const imageUrl = URL.createObjectURL(file);
        return (
            <MyImage
                key={index}
                src={imageUrl}
                fit="contain"
                imageProps={{ onLoad: () => URL.revokeObjectURL(imageUrl) }}
            />
        );
    });

    const cloudUpload = (images) => {
        setIsLoading(true);
        const cloudManager = [];
        const uploaders = images.map(async (file) => {
            // Initial FormData
            const formData = new FormData();
            formData.append("file", file.src);
            formData.append("name", file.name);
            formData.append("upload_preset", import.meta.env.VITE_UPLOAD_PRESET); 
            formData.append("api_key", import.meta.env.VITE_IMAGE_KEY); //
            formData.append("timestamp", (Date.now() / 1000) | 0);

            return axios
                .post(
                    "https://api.cloudinary.com/v1_1/reav_hub_/image/upload",
                    formData,
                    {
                        headers: { "X-Requested-With": "XMLHttpRequest" },
                    }
                )
                .then((response) => {
                    const data = response.data;
                    const fileURL = data.secure_url; 
                    cloudManager.push({ src: fileURL });
                });
        });
        axios.all(uploaders).then(() => {
            //   console.log('cloudmanager', cloudManager);
            if (cloudManager.length === images.length) {
                handleSubmitImage(cloudManager);
            }
            setTimeout(() => {
                setIsLoading(false);
                close();
            }, 2000);
        });
    };

    const handleClose = () => {
        setIsLoading(false);
        setIsCrop(false);
        resetRef.current?.();
        close();
    };

    return (
        <>
            <FileButton
                onChange={handleChange}
                accept="image/png,image/jpeg"
                resetRef={resetRef}
                multiple={multiple}
            >
                {(props) => (
                    <div
                        {...props}
                    >
                        {children}
                    </div>
                )}
            </FileButton>
            <Modal.Root
                opened={opened}
                scrollAreaComponent={ScrollArea.Autosize}
                onClose={handleClose}
                size={"md"}
            >
                <Modal.Overlay />
                <Modal.Content
                p={20}
                >
                    <Modal.Header>
                        <Modal.Title>Crop</Modal.Title>
                        <Modal.CloseButton />
                    </Modal.Header>
                    {!isCrop ? (
                        <>
                            <Modal.Body>
                                <SimpleGrid
                                    cols={3}
                                    breakpoints={[{ maxWidth: "sm", cols: 2 }]}
                                    mt={previews.length > 0 ? "xl" : 0}
                                >
                                    {previews}
                                </SimpleGrid>
                            </Modal.Body>

                            <div>
                                <Button
                                    onClick={() => onCrop(images)}
                                    loading={isLoading}
                                    color={color}
                                >
                                    Upload
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Modal.Body>
                                <div
                                    style={{
                                        height: "350px",
                                    }}
                                >
                                    <Cropper
                                        image={croppedImage !== "" && croppedImage}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={x / y}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>
                            </Modal.Body>

                            <div>
                                <Button
                                    loading={isLoading}
                                    color={color}
                                    onClick={cropImage}
                                >
                                    Crop Image
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Content>
            </Modal.Root>
        </>
    );
}
