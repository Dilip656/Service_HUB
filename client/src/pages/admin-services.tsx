import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { servicesAPI } from '@/lib/api';
import { useNotification } from '@/components/ui/notification';
import { Plus, Trash2 } from 'lucide-react';

export function ServicesView() {
  const { showNotification } = useNotification();
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: '',
    description: '',
    isActive: true
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['/api/services'],
    queryFn: () => servicesAPI.getAllServices(),
  });

  const createServiceMutation = useMutation({
    mutationFn: servicesAPI.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      showNotification('Service created successfully', 'success');
      setIsAddingService(false);
      setServiceForm({ name: '', category: '', description: '', isActive: true });
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to create service', 'error');
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, serviceData }: { id: number; serviceData: any }) =>
      servicesAPI.updateService(id, serviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      showNotification('Service updated successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update service', 'error');
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: servicesAPI.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      showNotification('Service deleted successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to delete service', 'error');
    },
  });

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.category.trim()) {
      showNotification('Name and category are required', 'error');
      return;
    }
    createServiceMutation.mutate(serviceForm);
  };

  const handleToggleStatus = (service: any) => {
    updateServiceMutation.mutate({
      id: service.id,
      serviceData: { isActive: !service.isActive }
    });
  };

  const handleDeleteService = (serviceId: number) => {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  if (isLoading) {
    return <div>Loading services...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Services Management</h2>
        <button
          onClick={() => setIsAddingService(!isAddingService)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isAddingService ? 'Cancel' : 'Add New Service'}
        </button>
      </div>

      {isAddingService && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Service</h3>
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  placeholder="e.g., Plumbing"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Select category</option>
                  <option value="home">Home & Property</option>
                  <option value="personal">Personal & Lifestyle</option>
                  <option value="events">Events & Celebrations</option>
                  <option value="business">Business Services</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                placeholder="Brief description of the service..."
                rows={3}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={serviceForm.isActive}
                onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Service is active</label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingService(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createServiceMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createServiceMutation.isPending ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services?.map((service: any) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{service.name}</div>
                    {service.description && (
                      <div className="text-sm text-gray-500">{service.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize bg-gray-100 text-gray-800">
                    {service.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(service.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleToggleStatus(service)}
                    disabled={updateServiceMutation.isPending}
                    className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                  >
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    disabled={deleteServiceMutation.isPending}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!services || services.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            No services found. Add your first service to get started.
          </div>
        )}
      </div>
    </div>
  );
}