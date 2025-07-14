import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Divider, Checkbox, Button,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationContext } from '../context/LocalizationContext';

// ✅ ВОЗВРАЩАЕМ ПОЛНУЮ ВЕРСИЮ ОБЪЕКТА С 4 ЛИНЗАМИ
const DUMMY_DREAM = {
  id: "dummy-dream-01",
  date: "2025-07-11",
  title: "Путешествие в мир кода (Тест)",
  keyImages: ["Компонент", "Стили", "Промис", "Рефакторинг"],
  snapshotSummary: "Этот сон символизирует творческий процесс разработки. Каждый элемент представляет собой этап создания приложения, от идеи до финальной реализации, полной гармонии и функциональности.",
  lenses: {
    psychoanalytic: {
      title: "Психоанализ",
      paragraphs: {
        freud: { title: "По Фрейду", content: "Компоненты во сне отражают ваше Супер-Эго — стремление к структуре и порядку. Желание провести рефакторинг — это работа вашего Эго, пытающегося примирить идеальный код с реальностью." },
        jung: { title: "По Юнгу", content: "Код символизирует коллективное бессознательное всех разработчиков. Путь через 'промисы' — это индивидуация, поиск собственной идентичности в мире асинхронного программирования." }
      }
    },
    esoteric: {
      title: "Эзотерика",
      paragraphs: {
        miller: { title: "Сонник Миллера", content: "Видеть во сне красивый код — к успешному завершению проектов и финансовому благополучию. Сломанные компоненты, напротив, предупреждают о возможных трудностях и препятствиях." },
        taro: { title: "Архетипы Таро", content: "Процесс разработки напоминает аркан 'Маг' (I), где вы, как творец, манипулируете элементами (компонентами). Рефакторинг связан с арканом 'Умеренность' (XIV), требующим баланса и терпения." }
      }
    },
    astrology: {
      title: "Астрология",
      paragraphs: {
        astrological: { title: "Астрологический подход", content: "Транзит Сатурна через ваш натальный Меркурий может вызывать трудности с логикой (баги в коде), в то время как гармоничный аспект Юпитера к Венере способствует творческому вдохновению в дизайне." },
        numerology: { title: "Нумерология", content: "Количество строк кода, версии библиотек, номера портов — все это несет в себе нумерологический смысл. Число '1' символизирует начало нового проекта, а '9' — его успешное завершение." }
      }
    },
    folkloric: {
      title: "Фольклор",
      paragraphs: {
        danielis: { title: "Somniale Danielis", content: "Писать код во сне — к получению важного известия. Если код исполняется без ошибок — жди добрых вестей, если же с ошибками — готовься к испытаниям." },
        slavic: { title: "Славянские поверья", content: "Чистый и работающий код — в доме будет достаток и порядок. 'Спагетти-код' же снится к запутанным делам и семейным ссорам. Сделайте резервную копию." }
      }
    }
  }
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const { t } = useContext(LocalizationContext);

  const [dreams, setDreams] = useState([DUMMY_DREAM]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDreams, setSelectedDreams] = useState(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleItemClick = (dream) => {
    if (isEditMode) {
      const newSelection = new Set(selectedDreams);
      newSelection.has(dream.id) ? newSelection.delete(dream.id) : newSelection.add(dream.id);
      setSelectedDreams(newSelection);
    } else {
      navigate('/interpretation', { state: { interpretationData: dream } });
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedDreams(new Set());
  };
  
  const handleDeleteDreams = () => {
    const newDreams = dreams.filter(dream => !selectedDreams.has(dream.id));
    setDreams(newDreams);
    setIsEditMode(false);
    setSelectedDreams(new Set());
    setIsConfirmOpen(false);
  };

  return (
    <>
      <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
          <Toolbar>
             {isEditMode && (
              <IconButton edge="start" color="error" onClick={() => setIsConfirmOpen(true)} disabled={selectedDreams.size === 0}>
                <DeleteIcon />
              </IconButton>
            )}
            <Typography variant="h5" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {isEditMode ? `Выбрано: ${selectedDreams.size}` : t('dreams')}
            </Typography>
            {!isEditMode && (
              <IconButton edge="end" color="primary" onClick={() => navigate('/')}>
                <AddIcon />
              </IconButton>
            )}
            <Button color="primary" onClick={toggleEditMode}>
              {isEditMode ? "Готово" : "Изменить"}
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {dreams.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: 'var(--text-secondary)', mt: 4 }}>
                    Тестовый сон удален. Перезагрузите страницу, чтобы он появился снова.
                </Typography>
            ) : (
                <List>
                    {dreams.map((dream) => {
                    const isSelected = selectedDreams.has(dream.id);
                    return (
                        <ListItem
                        key={dream.id}
                        disablePadding
                        secondaryAction={ isEditMode && <Checkbox edge="end" onChange={() => handleItemClick(dream)} checked={isSelected} /> }
                        sx={{ bgcolor: isSelected ? 'rgba(200, 80, 255, 0.1)' : 'transparent' }}
                        >
                        <ListItemButton onClick={() => handleItemClick(dream)}>
                            <ListItemIcon> <NightsStayIcon color="primary" /> </ListItemIcon>
                            <ListItemText
                            primary={dream.title}
                            secondary={dream.date}
                            primaryTypographyProps={{ fontWeight: '500' }}
                            secondaryTypographyProps={{ style: { color: 'var(--text-secondary)' } }}
                            />
                        </ListItemButton>
                        </ListItem>
                    );
                    })}
                </List>
            )}
        </Box>
      </Container>
      
      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <DialogContentText>Вы точно хотите удалить выбранные сны из истории?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmOpen(false)}>Нет</Button>
          <Button onClick={handleDeleteDreams} autoFocus color="error">Да, удалить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HistoryPage;