
    import { useState, useEffect, useCallback } from 'react';

    const useProfileState = (user, supabase, setUser, toast) => {
        const [profile, setProfile] = useState({
            codinome: '',
            discord_nick: '',
            steam_id: '',
            availability: '',
            biography: '',
            email: '',
            avatar_url: '',
            profile_games: [],
        });
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [showPassword, setShowPassword] = useState(false);
        const [newAvatarFile, setNewAvatarFile] = useState(null);
        const [loading, setLoading] = useState(true);
        const [isSaving, setIsSaving] = useState(false);
        const [ownedEffects, setOwnedEffects] = useState([]);
        const [activeEffectId, setActiveEffectId] = useState(null);
        const [isEffectLoading, setIsEffectLoading] = useState(false);

        const fetchProfile = useCallback(async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('members')
                    .select(`
                        *,
                        user_visual_effects (
                            is_active,
                            visual_effects ( id, name, description, css_class )
                        )
                    `)
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                if (data) {
                    setProfile({
                        id: data.id,
                        codinome: data.codinome || '',
                        discord_nick: data.discord_nick || '',
                        steam_id: data.steam_id || '',
                        availability: data.availability || '',
                        biography: data.biography || '',
                        email: data.email || user.email,
                        avatar_url: data.avatar_url || '',
                        profile_games: data.profile_games || [],
                    });

                    const effects = data.user_visual_effects.map(uve => ({
                        ...uve.visual_effects,
                        isActive: uve.is_active
                    }));
                    setOwnedEffects(effects);
                    const activeEffect = effects.find(e => e.isActive);
                    setActiveEffectId(activeEffect ? activeEffect.id : null);
                } else {
                    setProfile(prev => ({ ...prev, email: user.email }));
                }
            } catch (error) {
                toast({ title: "Erro ao carregar perfil", description: error.message, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }, [user, supabase, toast]);

        useEffect(() => {
            fetchProfile();
        }, [fetchProfile]);

        const handleSaveProfile = async () => {
            if (!profile.id) {
                toast({ title: "Perfil não encontrado", description: "Não foi possível encontrar um perfil de membro associado à sua conta.", variant: "destructive" });
                return;
            }
            setIsSaving(true);
            try {
                let avatarUrl = profile.avatar_url;
                if (newAvatarFile) {
                    const fileExt = newAvatarFile.name.split('.').pop();
                    const fileName = `${user.id}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, newAvatarFile, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                    avatarUrl = publicUrl;
                }

                const { error } = await supabase
                    .from('members')
                    .update({
                        codinome: profile.codinome,
                        discord_nick: profile.discord_nick,
                        steam_id: profile.steam_id,
                        availability: profile.availability,
                        biography: profile.biography,
                        avatar_url: avatarUrl,
                        profile_games: profile.profile_games,
                    })
                    .eq('id', profile.id);

                if (error) throw error;

                setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
                setNewAvatarFile(null);
                toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas com sucesso." });
            } catch (error) {
                toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
            } finally {
                setIsSaving(false);
            }
        };

        const handleChangePassword = async () => {
            if (password !== confirmPassword) {
                toast({ title: "As senhas não coincidem", variant: "destructive" });
                return;
            }
            if (password.length < 6) {
                toast({ title: "Senha muito curta", description: "A senha deve ter no mínimo 6 caracteres.", variant: "destructive" });
                return;
            }
            setIsSaving(true);
            try {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
                toast({ title: "Senha atualizada!", description: "Sua senha foi alterada com sucesso." });
                setPassword('');
                setConfirmPassword('');
            } catch (error) {
                toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
            } finally {
                setIsSaving(false);
            }
        };

        const handleSetEffect = async (effectId) => {
            if (!profile.id) return;
            setIsEffectLoading(true);
            try {
                const { error } = await supabase.rpc('set_active_visual_effect', {
                    p_member_id: profile.id,
                    p_effect_to_activate_id: effectId
                });
                if (error) throw error;
                setActiveEffectId(effectId);
                toast({ title: "Efeito visual atualizado!" });
            } catch (error) {
                toast({ title: "Erro ao definir efeito", description: error.message, variant: "destructive" });
            } finally {
                setIsEffectLoading(false);
            }
        };

        return {
            profile,
            setProfile,
            password,
            setPassword,
            confirmPassword,
            setConfirmPassword,
            showPassword,
            setShowPassword,
            newAvatarFile,
            setNewAvatarFile,
            loading,
            isSaving,
            ownedEffects,
            activeEffectId,
            isEffectLoading,
            handleSetEffect,
            handleSaveProfile,
            handleChangePassword,
        };
    };

    export default useProfileState;
  