import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, Col, Row, Typography } from "antd";
import { TRACKS } from "../../AppData/tracks";
import { COMMITTEE } from "../../AppData/committee";

const { Title, Paragraph, Text } = Typography;

const LandingPage = () => {
  const { t } = useTranslation();

  return (
    <div style={{ display: "grid", gap: 48, paddingBlock: 48 }}>
      {/* Hero */}
      <section style={{ display: "grid", gap: 24 }}>
        <Title level={1}>
          {t("landing.hero.title", { defaultValue: "Innovation for Resilience" })}
        </Title>
        <Paragraph style={{ maxWidth: 640, fontSize: 18 }}>
          {t("landing.hero.subtitle", {
            defaultValue:
              "Submit your ideas to support crisis management, civil defence, and social resilience across the country.",
          })}
        </Paragraph>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link to="/ideas/new">
            <Button type="primary" size="large">
              {t("landing.cta.submit", { defaultValue: "Submit Your Idea" })}
            </Button>
          </Link>
          <Link to="/tracks">
            <Button size="large">{t("landing.cta.tracks", { defaultValue: "Explore Tracks" })}</Button>
          </Link>
        </div>
      </section>

      {/* Tracks */}
      <section style={{ display: "grid", gap: 24 }}>
        <div>
          <Title level={2}>{t("landing.tracks.title", { defaultValue: "Tracks" })}</Title>
          <Paragraph>
            {t("landing.tracks.subtitle", {
              defaultValue:
                "Choose the track that best matches your concept. Each track is supported by expert mentors.",
            })}
          </Paragraph>
        </div>
        <Row gutter={[16, 16]}>
          {TRACKS.map((track) => (
            <Col xs={24} sm={12} lg={8} key={track.id}>
              <Card hoverable>
                <Title level={4}>{t(track.titleKey, { defaultValue: track.slug })}</Title>
                <Paragraph type="secondary">
                  {t(track.shortKey, {
                    defaultValue: t("landing.tracks.defaultDescription", {
                      defaultValue: "Bring practical solutions to the field.",
                    }),
                  })}
                </Paragraph>
                <Link to={`/tracks/${track.slug}`}>
                  {t("landing.tracks.readMore", { defaultValue: "Read more" })}
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Committee */}
      <section style={{ display: "grid", gap: 24 }}>
        <div>
          <Title level={2}>{t("landing.committee.title", { defaultValue: "Scientific Committee" })}</Title>
          <Paragraph>
            {t("landing.committee.subtitle", {
              defaultValue: "Meet the experts reviewing and supporting your submissions.",
            })}
          </Paragraph>
        </div>
        <Row gutter={[16, 16]}>
          {COMMITTEE.map((member) => (
            <Col xs={24} md={12} lg={8} key={member.id}>
              <Card>
                <Title level={4}>{t(member.name, { defaultValue: member.name })}</Title>
                <Paragraph style={{ marginBottom: 8 }}>
                  {t(member.role, { defaultValue: member.role })}
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }} type="secondary">
                  {t(member.affiliation, { defaultValue: member.affiliation })}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: 32,
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(24,144,255,0.15), rgba(24,144,255,0.05))",
          display: "grid",
          gap: 16,
        }}
      >
        <Title level={2}>{t("landing.finalCta.title", { defaultValue: "Ready to make impact?" })}</Title>
        <Paragraph style={{ maxWidth: 520 }}>
          {t("landing.finalCta.subtitle", {
            defaultValue:
              "Submit your proposal today and collaborate with leading experts to bring your innovation to life.",
          })}
        </Paragraph>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link to="/ideas/new">
            <Button type="primary" size="large">
              {t("landing.cta.submit", { defaultValue: "Submit Your Idea" })}
            </Button>
          </Link>
          <Link to="/register">
            <Button size="large">{t("landing.finalCta.register", { defaultValue: "Create account" })}</Button>
          </Link>
        </div>
        <Text type="secondary">
          {t("landing.finalCta.note", {
            defaultValue: "Need more information? Explore the tracks or contact the support team.",
          })}
        </Text>
      </section>
    </div>
  );
};

export default LandingPage;
