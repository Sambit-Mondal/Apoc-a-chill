import { useEffect, useState, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContextFile';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

const AddResourceSidebar = ({ isOpen, closeSidebar, fetchResources, editableResource }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [currency, setCurrency] = useState('Eth');
    const dropdownRef = useRef(null);
    const { user } = useContext(AuthContext);
    const [imageUrl, setImageUrl] = useState('');
    const [resource, setResource] = useState({
        title: '',
        description: '',
        tradeType: 'Monetary Trade',
        price: '',
        inReturn: '',
        quantity: 1,
    });

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleOptionClick = (currency) => {
        setCurrency(currency);
        setDropdownOpen(false);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownOpen(false);
        }
    };

    useEffect(() => {
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    // Reset resource state when transitioning between add and edit modes
    useEffect(() => {
        if (editableResource) {
            setResource({
                ...editableResource,
                price: editableResource.price || '',
                inReturn: editableResource.inReturn || '',
            });
            setImageUrl(editableResource.img);
        } else {
            setResource({
                title: '',
                description: '',
                tradeType: 'Monetary Trade',
                price: '',
                inReturn: '',
                quantity: 1,
            });
            setImageUrl('');
        }
    }, [editableResource, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setResource({ ...resource, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageUrl || !resource.title || !resource.quantity) {
            alert('Please fill all required fields and upload an image.');
            return;
        }

        const newResource = {
            ...resource,
            img: imageUrl,
            price: resource.tradeType === 'Monetary Trade' ? resource.price : null,
            inReturn: resource.tradeType === 'Trade for Items' ? resource.inReturn : null,
            ownerEmail: user.email
        };

        try {
            if (editableResource) {
                // Update existing resource
                await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/resource/${editableResource._id}`, newResource);
                alert('Resource updated successfully!');
            } else {
                // Add new resource
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/resource/add`, newResource);
                alert('Resource added successfully!');
            }
            fetchResources();
            closeSidebar();
        } catch (err) {
            console.error('Failed to save resource:', err);
            alert('Failed to save resource.');
        }
    };

    const handleDelete = async () => {
        if (!editableResource || !editableResource._id) {
            alert('Failed to delete resource: Missing resource ID.');
            return;
        }

        const confirmDelete = window.confirm('Are you sure you want to delete this resource?');
        if (!confirmDelete) return;

        try {
            const deleteUrl = `${import.meta.env.VITE_BACKEND_URL}/api/resource/${editableResource._id}`;
            console.log('DELETE Request URL:', deleteUrl);

            await axios.delete(deleteUrl);
            alert('Resource deleted successfully!');
            fetchResources();
            closeSidebar();
        } catch (err) {
            console.error('Failed to delete resource:', err);
            alert('Failed to delete resource. Please try again.');
        }
    };


    const handleUploadImage = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();

        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/cloudinary-signature`);

            formData.append('file', file);
            formData.append('upload_preset', 'mlsa-hackathon');
            formData.append('timestamp', data.timestamp);
            formData.append('signature', data.signature);
            formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);

            const response = await axios.post('https://api.cloudinary.com/v1_1/sambit-mondal/image/upload', formData);
            setImageUrl(response.data.secure_url);
            alert('Image uploaded successfully!');
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload image. Please check your Cloudinary configuration.');
        }
    };

    return (
        <>
            {isOpen ?
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition ease-in-out duration-200"></div>
                : ''
            }
            <div
                className={`fixed top-0 right-0 w-[30%] h-full bg-mlsa-bg border-l-2 border-mlsa-sky-blue text-white z-50 shadow-lg transform ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    } transition-transform duration-300 ease-in-out overflow-hidden overflow-y-auto`}
            >
                <div className="p-5">
                    <button onClick={closeSidebar} className="text-red-500 font-bold absolute right-4 top-4 border-2 border-red-500 rounded-full w-8 h-8">X</button>
                    <div className='w-full flex flex-col'>
                        <h2 className="text-lg font-bold uppercase">{editableResource ? 'Edit Resource' : 'Add Resource'}</h2>
                        <hr className='border-none h-1 w-full bg-mlsa-sky-blue my-2 mb-6' />
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className='font-bold'>Upload Image:</label>
                            <input type="file" onChange={handleUploadImage} className="mt-2" />
                        </div>
                        <div>
                            <label className='font-bold'>Title:</label>
                            <input
                                type="text"
                                name="title"
                                value={resource.title}
                                onChange={handleChange}
                                required
                                className="w-full px-2 py-1 rounded-md bg-mlsa-bg border-2 border-mlsa-sky-blue"
                            />
                        </div>
                        <div>
                            <label className='font-bold'>Description (optional):</label>
                            <textarea
                                name="description"
                                value={resource.description}
                                onChange={handleChange}
                                className="w-full px-2 py-1 rounded-md bg-mlsa-bg border-2 border-mlsa-sky-blue"
                            />
                        </div>
                        <div>
                            <label className='font-bold'>Trade Type:</label>
                            <select
                                name="tradeType"
                                value={resource.tradeType}
                                onChange={handleChange}
                                className="w-full rounded-md bg-mlsa-bg border-2 border-mlsa-sky-blue px-2 py-1"
                            >
                                <option value="Monetary Trade">Monetary Trade</option>
                                <option value="Trade for Items">Trade for Items</option>
                            </select>
                        </div>
                        {resource.tradeType === 'Monetary Trade' ? (
                            <div>
                                <label className='font-bold'>Price:</label>
                                <div className='flex items-center justify-center gap-3'>
                                    <input
                                        type="number"
                                        name="price"
                                        value={resource.price}
                                        onChange={handleChange}
                                        className="w-[70%] rounded-md bg-mlsa-bg border-2 border-mlsa-sky-blue px-2 py-1"
                                        required
                                    />
                                    <div className="relative w-[30%]" ref={dropdownRef}>
                                        <button
                                            type="button"
                                            onClick={toggleDropdown}
                                            className="flex items-center justify-between border-2 rounded-md border-mlsa-sky-blue bg-transparent py-1 px-2 w-full text-left font-medium text-white outline-none cursor-pointer"
                                        >
                                            <span>{currency}</span>
                                            <ChevronDownIcon className="w-4 h-4 ml-2" />
                                        </button>
                                        {dropdownOpen && (
                                            <div className="absolute top-full mt-1 w-full text-center font-semibold border-2 border-mlsa-sky-blue bg-black rounded-md shadow-lg py-1 z-20">
                                                {['Wei', 'Eth'].map((currency) => (
                                                    <div
                                                        key={currency}
                                                        onClick={() => handleOptionClick(currency)}
                                                        className="block px-4 py-2 text-sm hover:bg-mlsa-sky-blue hover:text-black cursor-pointer"
                                                    >
                                                        {currency}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className='font-bold'>What do you want in return?</label>
                                <input
                                    type="text"
                                    name="inReturn"
                                    value={resource.inReturn}
                                    onChange={handleChange}
                                    className="w-full rounded-md bg-mlsa-bg border-2 border-mlsa-sky-blue px-2 py-1"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className='font-bold'>Quantity:</label>
                            <input
                                type="number"
                                name="quantity"
                                value={resource.quantity}
                                onChange={handleChange}
                                className="w-full rounded-md bg-mlsa-bg border-2 border-mlsa-sky-blue px-2 py-1"
                                required
                            />
                        </div>
                        <button type="submit" className="bg-mlsa-sky-blue text-black font-bold px-4 py-2 rounded-md transition duration-100 ease-in-out hover:bg-[#2b8484] hover:text-white">
                            {editableResource ? 'Update ' : 'Add '} Resource
                        </button>
                        {editableResource && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="border-2 border-mlsa-sky-blue text-white font-bold px-4 py-2 rounded-md mt-2 transition duration-100 ease-in-out hover:bg-red-800"
                            >
                                Delete Resource
                            </button>
                        )}
                    </form>
                </div>
            </div >
        </>
    );
};

AddResourceSidebar.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    closeSidebar: PropTypes.func.isRequired,
    fetchResources: PropTypes.func.isRequired,
    editableResource: PropTypes.object,
};

export default AddResourceSidebar;