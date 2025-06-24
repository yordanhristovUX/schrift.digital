import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Plus, Trash2, Edit, Save, X, Type, LayoutDashboard, CreditCard, Users, Settings, LogOut, Bold, Italic, List, Type as TypeIcon } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';
import { supabase } from '../../lib/supabase';
import { Font, FontWeight, FontStyle, LicenseType } from '../../types/font';

interface FontFormData {
  name: string;
  designer: string;
  foundry: string;
  category: string;
  description: string;
  is_paid: boolean;
  price?: number;
  subscriber_only: boolean;
  license_type: LicenseType;
  license_url?: string;
  year_published?: number;
  version?: string;
  copyright?: string;
  language_support: string[];
  opentype_features: string[];
  character_set: string[];
  sample_text?: string;
  tags: string[];
}

// Map to ensure correct enum values
const weightMap: Record<string, FontWeight> = {
  'thin': 'Thin',
  'extralight': 'ExtraLight',
  'light': 'Light',
  'regular': 'Regular',
  'medium': 'Medium',
  'semibold': 'SemiBold',
  'bold': 'Bold',
  'extrabold': 'ExtraBold',
  'black': 'Black'
};

const FontManager: React.FC = () => {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFontId, setEditingFontId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FontFormData>({
    name: '',
    designer: '',
    foundry: '',
    category: '',
    description: '',
    is_paid: false,
    license_type: 'Free',
    subscriber_only: false,
    language_support: [],
    opentype_features: [],
    character_set: [],
    tags: []
  });

  useEffect(() => {
    fetchFonts();
  }, []);

  const fetchFonts = async () => {
    const { data, error } = await supabase
      .from('fonts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fonts:', error);
      return;
    }

    setFonts(data || []);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
      setError(null);
    }
  };

  const handleEdit = (font: Font) => {
    setEditingFontId(font.id);
    setFormData({
      name: font.name,
      designer: font.designer || '',
      foundry: font.foundry || '',
      category: font.category || '',
      description: font.description || '',
      is_paid: font.is_paid || false,
      price: font.price,
      subscriber_only: font.subscriber_only || false,
      license_type: font.license_type as LicenseType || 'Free',
      license_url: font.license_url,
      year_published: font.year_published,
      version: font.version,
      copyright: font.copyright,
      language_support: font.language_support || [],
      opentype_features: font.opentype_features || [],
      character_set: font.character_set || [],
      sample_text: font.sample_text,
      tags: font.tags || []
    });
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      setError(null);

      const fontData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (editingFontId) {
        // Update existing font
        const { error: updateError } = await supabase
          .from('fonts')
          .update(fontData)
          .eq('id', editingFontId);

        if (updateError) throw updateError;
      } else {
        // Handle new font upload
        if (!selectedFiles.length) {
          setError('Please select at least one font file');
          return;
        }

        const weightFiles: Record<string, any> = {};

        // Upload each font file
        for (const file of selectedFiles) {
          const timestamp = new Date().getTime();
          const fileName = `${file.name.replace(/\.[^/.]+$/, "")}_${timestamp}${file.name.substring(file.name.lastIndexOf('.'))}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('fonts')
            .upload(`public/${fileName}`, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('fonts')
            .getPublicUrl(`public/${fileName}`);

          // Extract weight and style from filename using the weightMap
          const weightMatch = file.name.toLowerCase().match(/(thin|extralight|light|regular|medium|semibold|bold|extrabold|black)/);
          const styleMatch = file.name.toLowerCase().match(/(italic|oblique)/);

          const weightKey = weightMatch ? weightMatch[1] : 'regular';
          const weight = weightMap[weightKey] || 'Regular';
          const style = styleMatch ? styleMatch[1].charAt(0).toUpperCase() + styleMatch[1].slice(1) : 'Normal';

          weightFiles[`${weight}-${style}`] = {
            weight,
            style,
            path: publicUrl
          };
        }

        // Add font record to database
        const { error: dbError } = await supabase
          .from('fonts')
          .insert([{
            ...fontData,
            weight_files: weightFiles,
            weights: Object.values(weightFiles).map(w => w.weight),
            styles: Array.from(new Set(Object.values(weightFiles).map(w => w.style))),
            featured: false,
            downloads: 0,
            rating: 0
          }]);

        if (dbError) throw dbError;
      }

      setSelectedFiles([]);
      setFormData({
        name: '',
        designer: '',
        foundry: '',
        category: '',
        description: '',
        is_paid: false,
        license_type: 'Free',
        subscriber_only: false,
        language_support: [],
        opentype_features: [],
        character_set: [],
        tags: []
      });
      setShowForm(false);
      setEditingFontId(null);
      fetchFonts();
    } catch (error: any) {
      console.error('Error handling font:', error);
      setError(error.message || 'Failed to handle font');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fonts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFonts();
    } catch (error: any) {
      console.error('Error deleting font:', error);
      setError(error.message || 'Failed to delete font');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md z-30">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <Type size={24} className="text-violet-700 mr-3" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/admin/fonts"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700"
              >
                <Type size={20} />
                <span>Fonts</span>
              </Link>
              <Link
                to="/admin/subscriptions"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <CreditCard size={20} />
                <span>Subscriptions</span>
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Users size={20} />
                <span>Users</span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-red-50 text-red-600 w-full"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Font Manager</h1>
            <button
              onClick={() => {
                setEditingFontId(null);
                setFormData({
                  name: '',
                  designer: '',
                  foundry: '',
                  category: '',
                  description: '',
                  is_paid: false,
                  license_type: 'Free',
                  language_support: [],
                  opentype_features: [],
                  character_set: [],
                  tags: []
                });
                setShowForm(true);
              }}
              className="flex items-center bg-violet-700 text-white px-4 py-2 rounded-md hover:bg-violet-800 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Add New Font
            </button>
          </div>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {showForm && (
            <div className="mb-8 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {editingFontId ? 'Edit Font' : 'Add New Font'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingFontId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designer
                    </label>
                    <input
                      type="text"
                      value={formData.designer}
                      onChange={(e) => setFormData({ ...formData, designer: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Foundry
                    </label>
                    <input
                      type="text"
                      value={formData.foundry}
                      onChange={(e) => setFormData({ ...formData, foundry: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Serif">Serif</option>
                      <option value="Sans Serif">Sans Serif</option>
                      <option value="Display">Display</option>
                      <option value="Handwritten">Handwritten</option>
                      <option value="Monospace">Monospace</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Rich Text)
                    </label>
                    <div className="border border-gray-300 rounded-md">
                      <RichTextEditor
                        value={formData.description}
                        onChange={(value) => setFormData({ ...formData, description: value })}
                        placeholder="Enter font description with formatting..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_paid}
                        onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Paid Font</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.subscriber_only}
                        onChange={(e) => setFormData({ ...formData, subscriber_only: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Subscriber Only</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (if paid)
                    </label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        price: parseFloat(e.target.value)
                      })}
                      className="w-full p-2 border rounded-md"
                      disabled={!formData.is_paid}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Type
                    </label>
                    <select
                      value={formData.license_type}
                      onChange={(e) => setFormData({ ...formData, license_type: e.target.value as LicenseType })}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="Free">Free</option>
                      <option value="Free for personal use">Free for personal use</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Type
                    </label>
                    <select
                      value={formData.license_type}
                      onChange={(e) => setFormData({ ...formData, license_type: e.target.value as LicenseType })}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="Free">Free</option>
                      <option value="Free for personal use">Free for personal use</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>

                  {!editingFontId && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Files (Multiple weights/styles)
                      </label>
                      <input
                        type="file"
                        accept=".ttf,.otf,.woff,.woff2"
                        multiple
                        onChange={handleFileSelect}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Supported weights: Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language Support
                    </label>
                    <input
                      type="text"
                      value={formData.language_support.join(', ')}
                      onChange={(e) => setFormData({ ...formData, language_support: e.target.value.split(',').map(t => t.trim()) })}
                      className="w-full p-2 border rounded-md"
                      placeholder="Bulgarian, Russian, Serbian"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OpenType Features
                    </label>
                    <input
                      type="text"
                      value={formData.opentype_features.join(', ')}
                      onChange={(e) => setFormData({ ...formData, opentype_features: e.target.value.split(',').map(t => t.trim()) })}
                      className="w-full p-2 border rounded-md"
                      placeholder="liga, kern, smcp"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Character Set
                    </label>
                    <input
                      type="text"
                      value={formData.character_set.join(', ')}
                      onChange={(e) => setFormData({ ...formData, character_set: e.target.value.split(',').map(t => t.trim()) })}
                      className="w-full p-2 border rounded-md"
                      placeholder="Latin, Cyrillic, Greek"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-violet-700 text-white px-4 py-2 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Saving...' : (editingFontId ? 'Save Changes' : 'Upload Font')}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Font Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fonts.map((font) => (
                  <tr key={font.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{font.name}</div>
                      <div className="text-sm text-gray-500">
                        {Object.keys(font.weight_files || {}).length} weights
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{font.designer}</div>
                      <div className="text-sm text-gray-500">{font.foundry}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{font.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        font.subscriber_only
                          ? 'bg-red-100 text-red-800'
                          : font.is_paid 
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {font.subscriber_only ? 'Subscribers' : font.is_paid ? 'Paid' : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        font.is_paid 
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {font.license_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(font)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(font.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FontManager;