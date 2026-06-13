import { supabase } from './supabase';
import { authService } from './authService';
import { AdminProfile } from '../types';

export const profileService = {
  async getProfile(): Promise<AdminProfile | null> {
    const user = await authService.getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No profile found
      throw error;
    }

    return {
      name: data.nome || '',
      creci: data.creci || '', // Optional or default
      photoUrl: data.foto_url || '',
      whatsapp: data.whatsapp || data.telefone || '',
      headerMessage: data.bio || '',
      subdomain: data.slug || '',
      telefone: data.telefone || '',
      cidade: data.cidade || '',
      instagram: data.instagram || '',
    };
  },

  async updateProfile(profileData: Partial<AdminProfile>): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const updatePayload: any = {};
    if (profileData.name !== undefined) updatePayload.nome = profileData.name;
    if (profileData.photoUrl !== undefined) updatePayload.foto_url = profileData.photoUrl;
    if (profileData.whatsapp !== undefined) updatePayload.whatsapp = profileData.whatsapp;
    if (profileData.headerMessage !== undefined) updatePayload.bio = profileData.headerMessage;
    // Map other fields as needed here
    // Ignore creci for db update since it's not in db table requirements? We'll leave it in memory for now or let Supabase ignore it if not exists.

    const { error } = await supabase
      .from('perfis')
      .update(updatePayload)
      .eq('id', user.id);

    if (error) throw error;
  },

  async createProfile(profileData: Partial<AdminProfile>): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const payload = {
      id: user.id,
      nome: profileData.name || '',
      foto_url: profileData.photoUrl || '',
      whatsapp: profileData.whatsapp || '',
      bio: profileData.headerMessage || '',
    };

    const { error } = await supabase
      .from('perfis')
      .insert([payload]);

    if (error) throw error;
  }
};
