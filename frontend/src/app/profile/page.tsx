"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { user_service, useAppData } from "@/context/AppContext";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";
import { ArrowLeft, Save, User, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const ProfilePage = () => {
  const { user, isAuth, loading, setUser } = useAppData();
  const router = useRouter();
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const editHandler = () => {
    setIsEdit(!isEdit);
    if (!isEdit) {
      setName(user?.name || "");
      setAvatarFile(null);
    }
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = Cookies.get("token");
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const { data } = await axios.put(`${user_service}/api/v1/update/user`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
      });
      toast.success(data.message);
      setUser(data.user);
      setAvatarFile(null);
      setIsEdit(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "An error occurred");
      } else {
        toast.error("An error occurred");
      }
    }
  };

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/chat")}
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border-gray-700"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
            <p className="text-gray-400  mt-1">Manage your account settings</p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          <div className="bg-gray-700 p-8 border-b border-gray-600">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
                {user?.avatar?.url ? (
                  <Image
                    src={user.avatar.url}
                    alt={user.name}
                    width={80}
                    height={80}
                    unoptimized
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.name || "User"}
              </h2>
              <p className="text-gray-300 text-sm">Active now</p>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Display Name
                    </label>
                    {
                        isEdit ? <form onSubmit={submitHandler} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Profile Picture</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      if (file && file.size > 3 * 1024 * 1024) {
                                        toast.error("Avatar size should be under 3MB");
                                        return;
                                      }
                                      setAvatarFile(file);
                                    }}
                                    className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                                />
                            </div>
                            <div className="relative">
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"/>
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>

                            <div className="flex gap-3">
                                <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"><Save className="w-4 h-4"/>Save Changes</button>
                                <button type="button" onClick={editHandler} className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg">Cancel</button>   
                            </div>
                        </form> : <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 ">
                            <span className="text-white font-medium text-lg">{user?.name || "Not set"}</span>
                            <button onClick={editHandler} className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg">Edit</button>
                        </div>
                    }
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
