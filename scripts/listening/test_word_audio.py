import pathlib
import subprocess
import tempfile
import unittest

from word_audio import align_words, audio_stats, render_word, validate_word


class WordAudioTests(unittest.TestCase):
    def test_same_pronunciation_spelling_variants_are_accepted(self):
        result = align_words(['urbanisation', 'prey'], [
            {'word': 'urbanization', 'start': .2, 'end': .8},
            {'word': 'pray', 'start': 1.2, 'end': 1.8},
        ], 2)
        self.assertTrue(all(result))

    def test_british_spellings_match_whisper_american_spellings(self):
        # Bộ từ Vocabulary for IELTS dùng chính tả Anh; Whisper small.en ghi kiểu Mỹ.
        pairs = [('enrol', 'enroll'), ('enrolment', 'enrollment'), ('catalogue', 'catalog'),
                 ('summarise', 'summarize'), ('behaviour', 'behavior'), ('cheque', 'check'),
                 ('artefact', 'artifact'), ('programme', 'program'), ('instalment', 'installment'),
                 ('harbour', 'harbor'), ('analyse', 'analyze'), ('licence', 'license'),
                 ('travelling', 'traveling'), ('fibre', 'fiber'), ('mould', 'mold'),
                 ('driving licence', 'driving license'), ('practise', 'practice'), ('grey', 'gray')]
        for uk, us in pairs:
            with self.subTest(uk=uk):
                heard = [{'word': w, 'start': .2 + i * .3, 'end': .4 + i * .3} for i, w in enumerate(us.split())]
                self.assertIsNotNone(align_words([uk], heard, 2)[0])

    def test_spelling_rules_do_not_accept_a_different_word(self):
        for wanted, heard in [('harbour', 'harder'), ('catalogue', 'category'), ('enrol', 'enrich'), ('summarise', 'summary')]:
            with self.subTest(wanted=wanted):
                self.assertEqual(align_words([wanted], [{'word': heard, 'start': .2, 'end': .8}], 1), [None])

    def test_missing_word_does_not_relabel_following_clips(self):
        result = align_words(['driver', 'ripple', 'foster'], [
            {'word': 'driver', 'start': .2, 'end': .7},
            {'word': 'foster', 'start': 2.2, 'end': 2.8},
        ], 3)
        self.assertIsNone(result[1])
        self.assertAlmostEqual(result[2][0], 1.45)

    def test_compound_with_different_spacing_is_aligned(self):
        result = align_words(['self-esteem', 'air quality'], [
            {'word': 'self', 'start': .2, 'end': .4},
            {'word': 'esteem', 'start': .4, 'end': .8},
            {'word': 'air', 'start': 1.2, 'end': 1.4},
            {'word': 'quality', 'start': 1.4, 'end': 1.8},
        ], 2)
        self.assertEqual(result, [(0, 1), (1, 2)])

    def test_zero_duration_timestamps_keep_the_surrounding_word(self):
        result = align_words(['stem'], [
            {'word': 'produce', 'start': 1, 'end': 1.5},
            {'word': 'stem', 'start': 2.5, 'end': 2.5},
            {'word': 'originate', 'start': 3.5, 'end': 4},
        ], 5)
        self.assertEqual(result, [(2, 3)])

    def test_similar_word_is_not_accepted_as_the_expected_word(self):
        self.assertEqual(align_words(['revolution'], [
            {'word': 'evolution', 'start': .2, 'end': .9},
        ], 1), [None])
        self.assertEqual(align_words(['evolution'], [
            {'word': 'revolution', 'start': .2, 'end': .9},
        ], 1), [None])

    def test_fade_keeps_the_word_after_first_40ms(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = pathlib.Path(temp)
            wav = folder / "speech.wav"
            subprocess.run([
                "ffmpeg", "-v", "error", "-f", "lavfi", "-i",
                "sine=frequency=440:duration=0.6:sample_rate=24000",
                str(wav),
            ], check=True)
            broken = folder / "broken.mp3"
            render_word(wav, 0, 0.6, broken, "afade=t=in:d=0.01,afade=t=out:d=0.04")
            with self.assertRaises(ValueError):
                validate_word(broken)
            fixed = folder / "fixed.mp3"
            render_word(wav, 0, 0.6, fixed)
            self.assertGreater(validate_word(fixed)["tail_db"], -30)
            self.assertGreater(audio_stats(fixed)["duration"], 0.5)


if __name__ == "__main__":
    unittest.main()
